import { Sequelize } from 'sequelize';
import * as dateFns from 'date-fns';
import {
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    PFPLAN_PHOTO_PATH,
    ASSET_URL,
    S3_OBJECT_URL,
    ADMIN_ACCOUNT_TYPE_ID,
    PUBLISHED_PF_PLAN_STATUS_ID,
    FAVORITE_PF_PLAN_STATUS,
    NOTIFICATIONS,
    DRAFT_PF_PLAN_STATUS_ID,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class PfPlanService {
    constructor({ logger, database, helper, storage, notificationService }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
        this.storage = storage;
        this.notificationService = notificationService;
    }

    /**
     * Compute PF plan progress percentage
     *
     * @param {number} fulfilled Number of fulfilled days
     * @param {number} unfulfilled Number of unfulfilled days
     * @returns
     */
    _computePfPlanProgressPercentage(fulfilled, unfulfilled) {
        if (fulfilled === undefined && unfulfilled === undefined) return 0;

        return Math.ceil((fulfilled / (fulfilled + unfulfilled)) * 100);
    }

    /**
     * Extract PF plan default content progress
     *
     * @param {number} contentDay PF plan content day
     * @param {number} elapsedDays Elapsed time from start to current date
     * @param {object=} dailyProgress User daily progress
     * @returns {object}
     */
    _extractPfPlanDefaultContentProgress(contentDay, elapsedDays, dailyProgress) {
        console.log(contentDay, elapsedDays);
        const defaultContentProgress =
            elapsedDays < contentDay
                ? null
                : {
                      is_skip: false,
                      is_fulfilled: false,
                  };
        return dailyProgress
            ? {
                  is_skip: dailyProgress?.is_skip,
                  is_fulfilled: dailyProgress?.is_fulfilled,
              }
            : defaultContentProgress;
    }

    /**
     * Extract PF plan default daily progress
     *
     * @param {number} contentDay PF plan content day
     * @param {number} elapsedDays Elapsed time from start to current date
     * @param {object=} dailyProgress User daily progress
     * @returns {object}
     */
    _extractPfPlanDefaultDailyProgress(contentDay, elapsedDays, dailyProgress) {
        const defaultDayProgress =
            elapsedDays < contentDay
                ? null
                : {
                      has_skip: false,
                      is_fulfilled: false,
                  };

        return dailyProgress
            ? {
                  has_skip: dailyProgress?.has_skip,
                  is_fulfilled: dailyProgress?.is_fulfilled,
              }
            : defaultDayProgress;
    }

    /**
     * Create PF plan
     *
     * @param {object} data
     * @param {string} data.name PF plan name
     * @param {string} data.description PF plan description
     * @param {number} data.statusId PF plan status id
     * @param {object} data.photo PF plan photo
     * @param {object[]=} data.dailies PF plan daily content
     * @param {number} data.dailies[].day PF plan daily day indicator
     * @param {number} data.dailies[].name PF plan daily name
     * @param {object[]} data.dailies[].content
     * @param {number=} data.dailies[].content[].exercise_id PF plan daily content exercise id
     * @param {number=} data.dailies[].content[].sets PF plan daily content exercise sets
     * @param {number=} data.dailies[].content[].reps PF plan daily content exercise reps
     * @param {number=} data.dailies[].content[].hold PF plan daily content exercise hold
     * @param {number=} data.dailies[].content[].education_id PF plan daily content education id
     * @returns {Promise<PfPlans>} PfPlans instance
     * @throws {InternalServerError} If failed to create PF plan
     */
    async createPfPlan(data) {
        try {
            let storeResponse;

            if (data.photo !== undefined) {
                storeResponse = await this.storage.store(data.photo.name, data.photo.data, PFPLAN_PHOTO_PATH, {
                    contentType: data.photo.mimetype,
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            const pfPlanInfo = await this.database.transaction(async (transaction) => {
                const pfPlan = await this.database.models.PfPlans.create(
                    {
                        name: data.name,
                        description: data.description,
                        photo: storeResponse?.path ? `${ASSET_URL}/${storeResponse?.path}` : null,
                        is_premium: true,
                        status_id: data.statusId,
                    },
                    { transaction: transaction },
                );

                pfPlan.photo = this.helper.generateProtectedUrl(pfPlan.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                });

                if (data.dailies) {
                    let arrangement = 0;

                    await this.database.models.PfPlanDailies.bulkCreate(
                        data.dailies.map((daily) => ({
                            pf_plan_id: pfPlan.id,
                            name: daily.name,
                            day: daily.day,
                            pf_plan_daily_contents: daily.contents.map((content) => {
                                arrangement += 1;

                                return {
                                    pf_plan_id: pfPlan.id,
                                    arrangement: arrangement,
                                    exercise_id: content.exercise_id,
                                    sets: content.sets,
                                    reps: content.reps,
                                    hold: content.hold,
                                    education_id: content.education_id,
                                };
                            }),
                        })),
                        {
                            include: [
                                {
                                    model: this.database.models.PfPlanDailyContents,
                                    as: 'pf_plan_daily_contents',
                                },
                            ],
                            transaction: transaction,
                        },
                    );
                }

                return pfPlan;
            });

            if (pfPlanInfo.status_id === PUBLISHED_PF_PLAN_STATUS_ID) {
                this.notificationService.createNotification({
                    userId: undefined,
                    descriptionId: NOTIFICATIONS.NEW_PF_PLAN,
                    reference: JSON.stringify({ id: pfPlanInfo.id, name: pfPlanInfo.name }),
                });
            }

            return pfPlanInfo;
        } catch (error) {
            this.logger.error('Failed to create PF plan.', error);

            throw new exceptions.InternalServerError('Failed to create PF plan', error);
        }
    }

    /**
     * Update pf plan
     *
     * @param {object} data
     * @param {number} data.id PF plan id
     * @param {string=} data.name PF plan name
     * @param {string=} data.description PF plan description
     * @param {number=} data.statusId PF plan status id
     * @param {object=} data.photo PF plan photo
     * @param {object[]=} data.exercises PF plan exercises
     * @param {number=} data.dailies[].daily_id PF plan daily id
     * @param {number} data.dailies[].day PF plan daily day indicator
     * @param {number} data.dailies[].name PF plan daily name
     * @param {number} data.dailies[].content[].content_id PF plan daily content id
     * @param {number=} data.dailies[].content[].exercise_id PF plan daily content workout id
     * @param {number=} data.dailies[].content[].sets PF plan daily content exercise sets
     * @param {number=} data.dailies[].content[].reps PF plan daily content exercise reps
     * @param {number=} data.dailies[].content[].hold PF plan daily content exercise hold
     * @param {number=} data.dailies[].content[].education_id PF plan daily content education id
     * @returns {Promise<PfPlans>} PF plans model instance
     * @throws {InternalServerError} If failed to update pf plan
     */
    async updatePfPlan(data) {
        let storeResponse;
        try {
            if (data.photo !== undefined) {
                storeResponse = await this.storage.store(data.photo.name, data.photo.data, PFPLAN_PHOTO_PATH, {
                    contentType: data.photo.mimetype,
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            const pfPlan = await this.database.models.PfPlans.findOne({ where: { id: data.id } });

            const oldStatus = pfPlan.status_id;

            const oldPhoto = pfPlan.photo;

            pfPlan.name = data.name;

            pfPlan.description = data.description;

            pfPlan.photo = storeResponse?.path ? `${ASSET_URL}/${storeResponse?.path}` : undefined;

            pfPlan.status_id = data.statusId;

            await pfPlan.save();

            await pfPlan.reload();

            if (storeResponse?.path && oldPhoto) {
                await this.storage.delete(oldPhoto.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            pfPlan.photo = this.helper.generateProtectedUrl(pfPlan.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            delete pfPlan.dataValues.deleted_at;

            if (data.dailies) {
                let arrangement = 0;

                const toRemoveDailiesIds = [];

                const toRemoveDailyContentsIds = [];

                const upcomingContentsIds = [];

                const upcomingDailiesIds = [];

                data.dailies.forEach((incomingDaily) => {
                    upcomingDailiesIds.push(Number(incomingDaily.daily_id));

                    incomingDaily.contents.forEach((incomingContent) => upcomingContentsIds.push(Number(incomingContent.content_id)));
                });

                const pfPlanDailies = await this.database.models.PfPlanDailies.findAll({ where: { pf_plan_id: data.id } });

                const pfPlanDailyContents = await this.database.models.PfPlanDailyContents.findAll({ where: { pf_plan_id: data.id } });

                pfPlanDailyContents.forEach((content) => {
                    if (!upcomingContentsIds.includes(content.id)) {
                        toRemoveDailyContentsIds.push(content.id);
                    }
                });

                pfPlanDailies.forEach((daily) => {
                    if (!upcomingDailiesIds.includes(daily.id)) {
                        toRemoveDailiesIds.push(daily.id);
                    }
                });

                await this.database.transaction(async (transaction) => {
                    await this.database.models.PfPlanDailyContents.destroy({ where: { id: toRemoveDailyContentsIds } }, { transaction: transaction });

                    await this.database.models.PfPlanDailies.destroy({ where: { id: toRemoveDailiesIds } }, { transaction: transaction });

                    const updatePayload = data.dailies.map((daily) => ({
                        daily: {
                            id: daily.daily_id,
                            pf_plan_id: pfPlan.id,
                            day: daily.day,
                            name: daily.name,
                        },
                        contents: daily.contents.map((content) => {
                            arrangement += 1;

                            return {
                                id: content.content_id,
                                pf_plan_id: pfPlan.id,
                                arrangement: arrangement,
                                exercise_id: content.exercise_id,
                                sets: content.sets,
                                reps: content.reps,
                                hold: content.hold,
                                education_id: content.education_id,
                            };
                        }),
                    }));

                    await Promise.all(
                        updatePayload.map(async (payload) => {
                            const [updatedPfPlanDailies] = await this.database.models.PfPlanDailies.upsert(payload.daily, {
                                transaction: transaction,
                            });

                            await Promise.all(
                                payload.contents.map((content) =>
                                    this.database.models.PfPlanDailyContents.upsert(
                                        {
                                            ...content,
                                            pf_plan_daily_id: updatedPfPlanDailies.id,
                                        },
                                        { transaction: transaction },
                                    ),
                                ),
                            );
                        }),
                    );
                });
            }

            if (oldStatus === DRAFT_PF_PLAN_STATUS_ID) {
                this.notificationService.createNotification({
                    userId: undefined,
                    descriptionId: NOTIFICATIONS.NEW_PF_PLAN,
                    reference: JSON.stringify({ id: pfPlan.id, name: pfPlan.name }),
                });
            }

            return pfPlan;
        } catch (error) {
            if (storeResponse !== undefined) {
                await this.storage.delete(storeResponse?.path, { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            this.logger.error('Failed to update PF plan.', error);

            throw new exceptions.InternalServerError('Failed to update PF plan', error);
        }
    }

    /**
     * Get list of pf plans
     *
     * @param {object} filter
     * @param {number=} filter.authenticatedUser Authenticated user
     * @param {string=} filter.id Pf plan id
     * @param {string=} filter.name Pf plan name
     * @param {Array=} filter.sort Field and order to be use for sorting
     * @example [ [ {field}:{order} ] ]
     * @param {number=} filter.page Page for list to navigate
     * @param {number=} filter.pageItems Number of items return per page
     * @returns {Promise<{
     * data: PfPlans[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Pf Plans isntance and pagination details
     * @throws {InternalServerError} If failed to get pf plans
     * @throws {NotFoundError} If no records found
     */
    async getPfPlans(filter) {
        const options = {
            nest: true,
            subQuery: false,
            limit: filter.pageItems,
            offset: filter.page * filter.pageItems - filter.pageItems,
            attributes: [
                'id',
                'name',
                'description',
                'photo',
                'is_premium',
                ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                    ? [[Sequelize.fn('COALESCE', Sequelize.col('user_pf_plan.user_id'), null, 0), 'is_selected']]
                    : []),
                'created_at',
                'updated_at',
            ],
            include: [
                {
                    model: this.database.models.Statuses,
                    as: 'status',
                    attributes: ['id', 'value'],
                    where: {},
                },
                ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                    ? [
                          {
                              model: this.database.models.UserPfPlanProgress,
                              as: 'user_pf_plan_progress',
                              attributes: ['fulfilled', 'unfulfilled', 'skipped'],
                              required: false,
                              where: {
                                  user_id: filter?.authenticatedUser?.user_id,
                              },
                              limit: 1,
                              order: [['updated_at', 'DESC']],
                          },
                          {
                              model: this.database.models.UserPfPlans,
                              as: 'user_pf_plan',
                              attributes: [],
                              required: false,
                              where: {
                                  user_id: filter?.authenticatedUser?.user_id,
                              },
                          },
                      ]
                    : []),
            ],
            order: [['id', 'DESC']],
            where: {
                ...(filter.id && { id: filter.id }),
                ...(filter.name && { name: { [Sequelize.Op.like]: `%${filter.name}%` } }),
                ...(filter.statusId && { status_id: filter.statusId }),
            },
        };

        if (filter.sort !== undefined) {
            options.order = this.helper.parseSortList(
                filter.sort,
                {
                    id: undefined,
                    name: undefined,
                    is_premium: undefined,
                },
                this.database,
            );
        }

        let count;
        let rows;
        try {
            ({ count, rows } = await this.database.models.PfPlans.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get PF plans', error);
        }

        if (!rows.length) throw new exceptions.NotFound('No records found.');

        rows = rows.map((row) => {
            row.photo = this.helper.generateProtectedUrl(row.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            const userPfPlanProgress = row.user_pf_plan_progress?.[0];

            delete row.dataValues.user_pf_plan_progress;

            row.dataValues.user_pf_plan_progress_percentage = this._computePfPlanProgressPercentage(
                userPfPlanProgress?.fulfilled,
                userPfPlanProgress?.unfulfilled,
            );

            if (row.dataValues.is_selected !== undefined) {
                row.dataValues.is_selected = Boolean(row.dataValues.is_selected);
            }

            return row;
        });

        return {
            data: rows,
            page: filter.page,
            page_items: filter.pageItems,
            max_page: Math.ceil(count / filter.pageItems),
        };
    }

    /**
     * Get pf plan details including all exercises in it
     *
     * @param {number} id PF plan id
     * @param {object} filter
     * @param {number=} filter.statusId Workout status id
     * @param {object=} filter.authenticatedUser Authenticated user
     * @returns {Promise<PfPlans>} PfPlans instance
     * @throws {InternalServerError} If failed to get PF plan details
     */
    async getPfPlanDetails(id, filter) {
        try {
            const pfPlan = await this.database.models.PfPlans.findOne({
                nest: true,
                subQuery: false,
                attributes: [
                    'id',
                    'name',
                    'description',
                    'photo',
                    'is_premium',
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [
                              [Sequelize.fn('COALESCE', Sequelize.col('is_favorite'), null, 0), 'is_favorite'],
                              [Sequelize.fn('COALESCE', Sequelize.col('user_pf_plan.user_id'), null, 0), 'is_selected'],
                          ]
                        : []),
                    'created_at',
                    'updated_at',
                ],
                include: [
                    {
                        model: this.database.models.Statuses,
                        as: 'status',
                        attributes: ['id', 'value'],
                        where: {},
                    },
                    {
                        model: this.database.models.PfPlanDailies,
                        as: 'pf_plan_dailies',
                        required: false,
                        attributes: {
                            exclude: ['deleted_at', 'pf_plan_id', 'created_at', 'updated_at'],
                        },
                        include: [
                            {
                                model: this.database.models.PfPlanDailyContents,
                                as: 'pf_plan_daily_contents',
                                attributes: {
                                    exclude: [
                                        'deleted_at',
                                        'created_at',
                                        'updated_at',
                                        'pf_plan_id',
                                        'pf_plan_daily_id',
                                        'exercise_id',
                                        'education_id',
                                        'arrangement',
                                    ],
                                },
                                include: [
                                    {
                                        model: this.database.models.Exercises,
                                        as: 'exercise',
                                        required: false,
                                        attributes: {
                                            exclude: ['deleted_at', 'reps', 'sets', 'hold'],
                                        },
                                        where: {},
                                    },
                                    {
                                        model: this.database.models.Educations,
                                        as: 'education',
                                        required: false,
                                        attributes: {
                                            exclude: ['deleted_at'],
                                        },
                                        where: {},
                                    },
                                ],
                                where: {},
                            },
                        ],
                    },
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [
                              {
                                  model: this.database.models.UserPfPlanProgress,
                                  as: 'user_pf_plan_progress',
                                  attributes: ['fulfilled', 'unfulfilled', 'skipped'],
                                  required: false,
                                  where: {
                                      user_id: filter.authenticatedUser.user_id,
                                  },
                                  limit: 1,
                                  order: [['updated_at', 'DESC']],
                              },
                              {
                                  model: this.database.models.UserFavoritePfPlans,
                                  as: 'user_favorite_pf_plans',
                                  attributes: [],
                                  required: false,
                                  where: {
                                      user_id: filter.authenticatedUser.user_id,
                                  },
                              },
                              {
                                  model: this.database.models.UserPfPlans,
                                  as: 'user_pf_plan',
                                  attributes: [],
                                  required: false,
                                  where: {
                                      user_id: filter?.authenticatedUser?.user_id,
                                  },
                              },
                          ]
                        : []),
                ],
                order: [
                    [{ model: this.database.models.PfPlanDailies, as: 'pf_plan_dailies' }, 'day', 'ASC'],
                    [
                        { model: this.database.models.PfPlanDailies, as: 'pf_plan_dailies' },
                        { model: this.database.models.PfPlanDailyContents, as: 'pf_plan_daily_contents' },
                        'arrangement',
                        'ASC',
                    ],
                ],
                where: {
                    id: id,
                    ...(filter.statusId && { status_id: filter.statusId }),
                },
            });

            pfPlan.photo = this.helper.generateProtectedUrl(pfPlan.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            if (pfPlan.dataValues.is_favorite !== undefined) {
                pfPlan.dataValues.is_favorite = Boolean(pfPlan.dataValues.is_favorite);
            }

            if (pfPlan.dataValues.is_selected !== undefined) {
                pfPlan.dataValues.is_selected = Boolean(pfPlan.dataValues.is_selected);
            }

            const userPfPlanProgress = pfPlan.user_pf_plan_progress?.[0];

            delete pfPlan.dataValues.user_pf_plan_progress;

            pfPlan.dataValues.user_pf_plan_progress_percentage = this._computePfPlanProgressPercentage(
                userPfPlanProgress?.fulfilled,
                userPfPlanProgress?.unfulfilled,
            );

            if (pfPlan.pf_plan_dailies) {
                pfPlan.dataValues.pf_plan_dailies = pfPlan.dataValues.pf_plan_dailies.map((pfPlanDaily) => {
                    pfPlanDaily.dataValues.contents = pfPlanDaily.pf_plan_daily_contents.map((pfPlanDailyContent) => {
                        if (pfPlanDailyContent.dataValues.exercise) {
                            pfPlanDailyContent.dataValues.exercise.sets = pfPlanDailyContent.sets;

                            pfPlanDailyContent.dataValues.exercise.reps = pfPlanDailyContent.reps;

                            pfPlanDailyContent.dataValues.exercise.hold = pfPlanDailyContent.hold;

                            pfPlanDailyContent.dataValues.exercise.photo = this.helper.generateProtectedUrl(
                                pfPlanDailyContent.exercise?.photo,
                                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                                {
                                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                                },
                            );

                            pfPlanDailyContent.dataValues.exercise.video = this.helper.generateProtectedUrl(
                                pfPlanDailyContent.exercise?.video,
                                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                                {
                                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                                },
                            );
                        }

                        delete pfPlanDailyContent.dataValues.sets;

                        delete pfPlanDailyContent.dataValues.reps;

                        delete pfPlanDailyContent.dataValues.hold;

                        if (pfPlanDailyContent.dataValues.education) {
                            pfPlanDailyContent.dataValues.education.photo = this.helper.generateProtectedUrl(
                                pfPlanDailyContent.education?.photo,
                                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                                {
                                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                                },
                            );

                            pfPlanDailyContent.dataValues.education.media_upload = this.helper.generateProtectedUrl(
                                pfPlanDailyContent.education?.media_upload,
                                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                                {
                                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                                },
                            );
                        }

                        return pfPlanDailyContent;
                    });

                    delete pfPlanDaily.dataValues.pf_plan_daily_contents;

                    return pfPlanDaily;
                });
            }

            return pfPlan;
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get pf plan details', error);
        }
    }

    /**
     * Remove PF plan
     *
     * @param {number} id PF plan id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to remove PF plan
     */
    async removePfPlan(id) {
        try {
            const pfPlan = await this.database.models.PfPlans.findOne({ where: { id: id } });

            if (pfPlan.photo) {
                await this.storage.delete(pfPlan.photo.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }
            return await pfPlan.destroy();
        } catch (error) {
            this.logger.error('Failed to remove PF plan', error);

            throw new exceptions.InternalServerError('Failed to remove PF plan', error);
        }
    }

    /**
     * Check if pf plan exist using id
     *
     * @param {number} id PF plan id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check pf plan by id
     */
    async isPfPlanExistById(id) {
        try {
            return Boolean(await this.database.models.PfPlans.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check pf plan', error);
        }
    }

    /**
     * Check if premium plan exist using id
     *
     * @param {number} id PF plan id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check pf plan by id
     */
    async isPublishedPfPlanExistById(id) {
        try {
            return Boolean(await this.database.models.PfPlans.count({ where: { id: id, status_id: PUBLISHED_PF_PLAN_STATUS_ID } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check published PF plan', error);
        }
    }

    /**
     * Check if pf plan has daily content
     *
     * @param {number} id PF plan id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check pf plan has daily content
     */
    async hasDailies(id) {
        try {
            return Boolean(await this.database.models.PfPlanDailies.count({ where: { pf_plan_id: id } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check PF plan has daily content', error);
        }
    }

    /**
     * Update user PF plan favorite status
     *
     * @param {number} userId User account id
     * @param {number} pfPlanId PF plan id
     * @param {boolean} favoriteStatus PF plan favorite status
     * @throws {InternalServerError} If failed to update favorite PF plans
     * @returns {Promise<UserFavoritePfPlans>} UserFavoritePfPlans instance
     */
    async updateUserFavoritePfPlans(userId, pfPlanId, favoriteStatus) {
        try {
            const [userPfPlansFavorite, createdUserPfPlanFavorite] = await this.database.models.UserFavoritePfPlans.findOrCreate({
                where: {
                    user_id: userId,
                    pf_plan_id: pfPlanId,
                },
                defaults: {
                    user_id: userId,
                    pf_plan_id: pfPlanId,
                    is_favorite: favoriteStatus,
                },
            });

            if (userPfPlansFavorite) {
                userPfPlansFavorite.is_favorite = favoriteStatus;

                await userPfPlansFavorite.save();
            }

            return userPfPlansFavorite ?? createdUserPfPlanFavorite;
        } catch (error) {
            this.logger.error('Failed to update favorite PF plans.', error);

            throw new exceptions.InternalServerError('Failed to update favorite PF plans.', error);
        }
    }

    /**
     * Get favorite PF plans for user
     *
     * @param {object} filter
     * @param {number} filter.userId User account user id
     * @param {string=} filter.id Pf Plan id
     * @param {string=} filter.name Pf Plan name
     * @param {number} filter.page Page number
     * @param {number} filter.pageItems Items per page
     * @returns {Promise<{
     * data: PfPlans[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} PfPlans instance and pagination details
     * @throws {InternalServerError} If failed to get favorite PF plans
     * @throws {NotFoundError} If no records found
     */
    async getFavoritePfPlans(filter) {
        const options = {
            nest: true,
            subQuery: false,
            limit: filter.pageItems,
            offset: filter.page * filter.pageItems - filter.pageItems,
            attributes: {
                exclude: ['deleted_at', 'status_id'],
            },
            include: [
                {
                    model: this.database.models.Statuses,
                    as: 'status',
                    attributes: ['id', 'value'],
                    where: {},
                },
                {
                    model: this.database.models.UserFavoritePfPlans,
                    as: 'user_favorite_pf_plans',
                    required: true,
                    attributes: [],
                    where: {
                        user_id: filter.userId,
                        is_favorite: true,
                    },
                },
            ],
            order: [['id', 'DESC']],
            where: {
                ...(filter.id && { id: filter.id }),
                ...(filter.name && { name: { [Sequelize.Op.like]: `%${filter.name}%` } }),
            },
        };

        let count;
        let rows;
        try {
            ({ count, rows } = await this.database.models.PfPlans.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get favorite PF plans', error);
        }

        if (!rows.length) throw new exceptions.NotFound('No records found.');

        rows = rows.map((row) => {
            row.photo = this.helper.generateProtectedUrl(row.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            row.media_upload = this.helper.generateProtectedUrl(row.media_upload, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            return row;
        });

        return {
            data: rows,
            page: filter.page,
            page_items: filter.pageItems,
            max_page: Math.ceil(count / filter.pageItems),
        };
    }

    /**
     * Check if favorite PF plan exist using id
     *
     * @param {number} id PF plan id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check favorite PF plan by id
     */
    async isFavoritePfPlanExistById(id, userId) {
        try {
            return Boolean(
                await this.database.models.UserFavoritePfPlans.count({
                    where: { pf_plan_id: id, is_favorite: FAVORITE_PF_PLAN_STATUS, user_id: userId },
                }),
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check favorite PF plan', error);
        }
    }

    /**
     * Check if PF plan exist using name
     *
     * @param {string} name PF plan name
     * @param {number=} id PF plan id to be exempt
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check PF plan by name
     */
    async isPfPlanNameExist(name, id) {
        try {
            return Boolean(await this.database.models.PfPlans.count({ where: { name: name, ...(id && { id: { [Sequelize.Op.ne]: id } }) } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check PF plan', error);
        }
    }

    /**
     * Select PF plan program
     *
     * @param {number} id PF plan id
     * @param {number} userId User account id
     * @returns {Promise<UserPfPlans>} UserPfPlans instance
     * @throws {InternalServerError} If failed to select PF plan program
     */
    async selectPfPlan(id, userId) {
        try {
            await this.database.models.UserPfPlans.destroy({ where: { user_id: userId } });

            return await this.database.models.UserPfPlans.create({ user_id: userId, pf_plan_id: id });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to select PF plan', error);
        }
    }

    /**
     * Get selected PF plan by user id
     *
     * @param {number} userId User account id
     * @returns {Promise<UserPfPlans>} UserPfPlans instance
     * @throws {InternalServerError} If failed to get selected PF plan
     */
    async getSelectedPfPlanByUserId(userId) {
        try {
            return await this.database.models.UserPfPlans.findOne({ where: { user_id: userId } });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get selected PF plan', error);
        }
    }

    /**
     * Check if PF plan is selected
     *
     * @param {number} id
     * @param {number} userId
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check selected PF plan
     */
    async isPfPlanSelectedById(id, userId) {
        try {
            return Boolean(await this.database.models.UserPfPlans.count({ where: { user_id: userId, pf_plan_id: id } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check selected PF plan', error);
        }
    }

    /**
     * Get PF plan daily content
     *
     * @param {number} pfPlanId PF plan id
     * @param {number} id PF plan daily id
     * @returns {Promise<PfPlanDailyContents>} PfPlanDailyContents instance
     * @throws {InternalServerError} If failed to get PF plan content
     */
    async getPfPlanDailyContentById(pfPlanId, id) {
        try {
            return this.database.models.PfPlanDailyContents.findOne({ where: { id: id, pf_plan_id: pfPlanId } });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get PF plan content', error);
        }
    }

    /**
     * Get PF plan daily
     *
     * @param {number} pfPlanId PF plan id
     * @param {number} id PF plan daily id
     * @returns {Promise<PfPlanDailies>} PfPlanDailies instance
     * @throws {InternalServerError} If failed to get PF plan daily
     */
    async getPfPlanDailyById(pfPlanId, id) {
        try {
            return this.database.models.PfPlanDailies.findOne({ where: { id: id, pf_plan_id: pfPlanId } });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get PF plan daily', error);
        }
    }

    /**
     * Update PF plan progress
     *
     * @param {number} pfPlanId PF plan id
     * @param {object} data
     * @param {number} data.userId User account id
     * @param {number} data.content PfPlanDailies instance
     * @param {number=} data.workoutExercise WorkoutExercises instance
     * @param {boolean=} data.isSkip Skip PF plan daily content
     * @throws {InternalServerError} If failed to update PF plan progress
     * @returns {Promise<void>}
     */
    async updatePfPlanProgress(pfPlanId, data) {
        const toRollback = [];

        try {
            const [pfPlanLastContentDay, pfPlanDailyTotalContents] = await Promise.all([
                this.database.models.PfPlanDailies.findOne({
                    where: { pf_plan_id: pfPlanId },
                    order: [['day', 'DESC']],
                }),
                this.database.models.PfPlanDailyContents.count({
                    where: { pf_plan_id: pfPlanId, pf_plan_daily_id: data.content.pf_plan_daily_id },
                }),
            ]);

            let [userPfPlanDailyProgress, userPfPlanProgress, totalUserPfPlanDailyFulfilled] = await Promise.all([
                this.database.models.UserPfPlanDailyProgress.findOne({
                    where: {
                        user_id: data.userId,
                        pf_plan_id: pfPlanId,
                        day: data.content.day,
                        pf_plan_daily_id: data.content.pf_plan_daily_id,
                        pf_plan_daily_content_id: data.content.id,
                    },
                }),
                this.database.models.UserPfPlanProgress.findOne({
                    where: { user_id: data.userId, pf_plan_id: pfPlanId, day: data.content.day },
                }),
                this.database.models.UserPfPlanDailyProgress.count({
                    where: { user_id: data.userId, pf_plan_id: pfPlanId, pf_plan_daily_id: data.content.pf_plan_daily_id, is_fulfilled: true },
                }),
            ]);

            totalUserPfPlanDailyFulfilled += Number(!data.isSkip);

            const userPfPlanDailyProgressResult = await this.database.models.UserPfPlanDailyProgress.upsert({
                id: userPfPlanDailyProgress?.id,
                user_id: data.userId,
                pf_plan_id: pfPlanId,
                pf_plan_daily_id: data.content.pf_plan_daily_id,
                pf_plan_daily_content_id: data.content.id,
                day: data.content.day,
                is_skip: data.isSkip,
                is_fulfilled: !data.isSkip,
                fulfilled: totalUserPfPlanDailyFulfilled,
                unfulfilled: Math.max(pfPlanDailyTotalContents - totalUserPfPlanDailyFulfilled, 0),
                total_contents: pfPlanDailyTotalContents,
            });

            [userPfPlanDailyProgress] = userPfPlanDailyProgressResult;

            if (userPfPlanDailyProgressResult[1]) toRollback.push(userPfPlanDailyProgress);

            userPfPlanDailyProgress.skipped = await this.database.models.UserPfPlanDailyProgress.count({
                where: { user_id: data.userId, pf_plan_id: pfPlanId, pf_plan_daily_id: data.content.pf_plan_daily_id, is_skip: true },
            });

            await userPfPlanDailyProgress.save();

            const totalUserPfPlanFulfilled = await this.database.models.UserPfPlanDailyProgress.count({
                where: { user_id: data.userId, pf_plan_id: pfPlanId, unfulfilled: 0 },
            });

            const userPfPlanDailyWithSkip = await this.database.models.UserPfPlanDailyProgress.findAll({
                where: { user_id: data.userId, pf_plan_id: pfPlanId, is_skip: true },
                group: ['pf_plan_id', 'day'],
            });

            [userPfPlanProgress] = await this.database.models.UserPfPlanProgress.upsert({
                id: userPfPlanProgress?.id,
                user_id: data.userId,
                pf_plan_id: pfPlanId,
                day: data.content.day,
                total_days: pfPlanLastContentDay.day,
                has_skip: Boolean(userPfPlanDailyProgress.skipped),
                is_fulfilled: !userPfPlanDailyProgress.unfulfilled,
                fulfilled: totalUserPfPlanFulfilled,
                unfulfilled: pfPlanLastContentDay.day - totalUserPfPlanFulfilled,
                skipped: userPfPlanDailyWithSkip.length,
            });

            return userPfPlanProgress;
        } catch (error) {
            await Promise.all(toRollback.map((record) => record.destroy({ force: true })));

            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to update PF plan progress.', error);
        }
    }

    /**
     * Get pf plan details including all exercises in it
     *
     * @param {number} userPfPlan UserPfPlans model instance
     * @returns {Promise<PfPlans>} PfPlans instance
     * @throws {InternalServerError} If failed to get PF plan details
     */
    async getPfPlanProgress(userPfPlan) {
        try {
            const userPfPlanProgress = await this.database.models.UserPfPlanProgress.findAll({
                where: { pf_plan_id: userPfPlan.pf_plan_id, user_id: userPfPlan.user_id },
            });

            const userPfPlanProgressObject = {};

            userPfPlanProgress.forEach((progress) => {
                userPfPlanProgressObject[progress.day] = progress;
            });

            const startPlan = userPfPlan.created_at;

            const currentDate = new Date();

            const dayDifference = dateFns.differenceInDays(currentDate, startPlan);

            const pfPlan = await this.database.models.PfPlans.findOne({
                nest: true,
                subQuery: false,
                attributes: ['id', 'name', 'description', 'photo', 'is_premium', 'created_at', 'updated_at'],
                include: [
                    {
                        model: this.database.models.Statuses,
                        as: 'status',
                        attributes: ['id', 'value'],
                        where: {},
                    },
                    {
                        model: this.database.models.PfPlanDailies,
                        as: 'pf_plan_dailies',
                        required: false,
                        attributes: {
                            exclude: ['deleted_at', 'pf_plan_id', 'created_at', 'updated_at'],
                        },
                        include: [
                            {
                                model: this.database.models.UserPfPlanDailyProgress,
                                as: 'user_pf_plan_daily_progress',
                                required: false,
                                attributes: ['is_skip', 'is_fulfilled', 'fulfilled', 'unfulfilled', 'skipped'],
                                where: {
                                    user_id: userPfPlan.user_id,
                                },
                            },
                            {
                                model: this.database.models.PfPlanDailyContents,
                                as: 'pf_plan_daily_contents',
                                attributes: {
                                    exclude: [
                                        'deleted_at',
                                        'created_at',
                                        'updated_at',
                                        'pf_plan_id',
                                        'pf_plan_daily_id',
                                        'exercise_id',
                                        'education_id',
                                        'arrangement',
                                    ],
                                },
                                include: [
                                    {
                                        model: this.database.models.Exercises,
                                        as: 'exercise',
                                        required: false,
                                        attributes: {
                                            exclude: ['deleted_at', 'sets', 'reps', 'hold'],
                                        },
                                        where: {},
                                    },
                                    {
                                        model: this.database.models.Educations,
                                        as: 'education',
                                        required: false,
                                        attributes: {
                                            exclude: ['deleted_at'],
                                        },
                                        where: {},
                                    },
                                ],
                            },
                        ],
                    },
                ],
                order: [
                    [{ model: this.database.models.PfPlanDailies, as: 'pf_plan_dailies' }, 'day', 'ASC'],
                    [
                        { model: this.database.models.PfPlanDailies, as: 'pf_plan_dailies' },
                        { model: this.database.models.PfPlanDailyContents, as: 'pf_plan_daily_contents' },
                        'arrangement',
                        'ASC',
                    ],
                ],
                where: {
                    id: userPfPlan.pf_plan_id,
                },
            });

            pfPlan.photo = this.helper.generateProtectedUrl(pfPlan.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            if (pfPlan.dataValues.is_favorite !== undefined) {
                pfPlan.dataValues.is_favorite = Boolean(pfPlan.dataValues.is_favorite);
            }

            pfPlan.dataValues.user_pf_plan_progress_percentage = null;

            const userLatestPfPlanProgress = await this.database.models.UserPfPlanProgress.findOne({
                where: { pf_plan_id: userPfPlan.pf_plan_id, user_id: userPfPlan.user_id },
                order: [['updated_at', 'DESC']],
            });

            pfPlan.dataValues.user_pf_plan_progress_percentage = this._computePfPlanProgressPercentage(
                userLatestPfPlanProgress?.fulfilled,
                userLatestPfPlanProgress?.unfulfilled,
            );

            pfPlan.dataValues.pf_plan_dailies = pfPlan.dataValues.pf_plan_dailies.map((pfPlanDaily) => {
                pfPlanDaily.dataValues.contents = pfPlanDaily.pf_plan_daily_contents.map((pfPlanDailyContent) => {
                    if (pfPlanDailyContent.dataValues.exercise) {
                        pfPlanDailyContent.dataValues.exercise.sets = pfPlanDailyContent.sets;

                        pfPlanDailyContent.dataValues.exercise.reps = pfPlanDailyContent.reps;

                        pfPlanDailyContent.dataValues.exercise.hold = pfPlanDailyContent.hold;

                        pfPlanDailyContent.dataValues.exercise.photo = this.helper.generateProtectedUrl(
                            pfPlanDailyContent.exercise?.photo,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );

                        pfPlanDailyContent.dataValues.exercise.video = this.helper.generateProtectedUrl(
                            pfPlanDailyContent.exercise?.video,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );
                    }

                    delete pfPlanDailyContent.dataValues.sets;

                    delete pfPlanDailyContent.dataValues.reps;

                    delete pfPlanDailyContent.dataValues.hold;

                    if (pfPlanDailyContent.dataValues.education) {
                        pfPlanDailyContent.dataValues.education.photo = this.helper.generateProtectedUrl(
                            pfPlanDailyContent.education?.photo,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );

                        pfPlanDailyContent.dataValues.education.media_upload = this.helper.generateProtectedUrl(
                            pfPlanDailyContent.education?.media_upload,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );
                    }

                    pfPlanDailyContent.dataValues.content_progress = this._extractPfPlanDefaultContentProgress(
                        pfPlanDaily.day,
                        dayDifference,
                        pfPlanDaily.user_pf_plan_daily_progress,
                    );

                    return pfPlanDailyContent;
                });

                const dayProgress = userPfPlanProgressObject?.[pfPlanDaily.day];

                pfPlanDaily.dataValues.day_progress = this._extractPfPlanDefaultDailyProgress(pfPlanDaily.day, dayDifference, dayProgress);

                delete pfPlanDaily.dataValues.pf_plan_daily_contents;

                delete pfPlanDaily.dataValues.user_pf_plan_daily_progress;

                return pfPlanDaily;
            });

            pfPlan.dataValues.start_at = startPlan;

            return pfPlan;
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get pf plan progress details', error);
        }
    }

    /**
     * Check if PF plan daily exist using name
     *
     * @param {string} name PF plan daily name
     * @param {number=} id PF plan daily id to be exempt
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check PF plan by name
     */
    async isPfPlanDailyNameExist(name, id) {
        try {
            return Boolean(await this.database.models.PfPlanDailies.count({ where: { name: name, ...(id && { id: { [Sequelize.Op.ne]: id } }) } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check PF plan daily content', error);
        }
    }

    /**
     * Check if PF plan daily exist using id
     *
     * @param {number} id PF plan daily id
     * @param {number=} pfPlanId PF plan id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check PF plan by id
     */
    async isPfPlanDailyExistById(id, pfPlanId) {
        try {
            return Boolean(
                await this.database.models.PfPlanDailies.count({ loggging: true, where: { id: id, ...(pfPlanId && { pf_plan_id: pfPlanId }) } }),
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check PF plan daily', error);
        }
    }

    /**
     * Check if PF plan daily content exist using id
     *
     * @param {number} id PF plan daily content id
     * @param {number=} pfPlanDailyId PF plan daily id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check PF plan daily content by id
     */
    async isPfPlanDailyContentExistById(id, pfPlanDailyId) {
        try {
            return Boolean(
                await this.database.models.PfPlanDailyContents.count({
                    where: { id: id, ...(pfPlanDailyId && { pf_plan_daily_id: pfPlanDailyId }) },
                }),
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check PF plan daily content', error);
        }
    }
}
