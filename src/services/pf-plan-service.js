import { Sequelize } from 'sequelize';
import {
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    PFPLAN_PHOTO_PATH,
    ASSET_URL,
    S3_OBJECT_URL,
    ADMIN_ACCOUNT_TYPE_ID,
    PUBLISHED_PF_PLAN_STATUS_ID,
    FAVORITE_PF_PLAN_STATUS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class PfPlanService {
    constructor({ logger, database, helper, storage }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
        this.storage = storage;
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
     * @param {number=} data.dailies[].workout_id PF plan daily content workout id
     * @param {number=} data.dailies[].education_id PF plan daily content education id
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

            return await this.database.transaction(async (transaction) => {
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
                    await this.database.models.PfPlanDailies.bulkCreate(
                        data.dailies.map((daily) => ({
                            pf_plan_id: pfPlan.id,
                            day: daily.day,
                            workout_id: daily.workout_id ?? null,
                            education_id: daily.education_id ?? null,
                        })),
                        {
                            transaction: transaction,
                        },
                    );
                }

                return pfPlan;
            });
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
     * @param {number} data.dailies[].day PF plan daily day indicator
     * @param {number=} data.dailies[].workout_id PF plan daily content workout id
     * @param {number=} data.dailies[].education_id PF plan daily content education id
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
                await this.database.transaction(async (transaction) => {
                    await this.database.models.PfPlanDailies.destroy({ where: { pf_plan_id: pfPlan.id }, transaction: transaction });

                    await this.database.models.PfPlanDailies.bulkCreate(
                        data.dailies.map((daily) => ({
                            pf_plan_id: pfPlan.id,
                            day: daily.day,
                            workout_id: daily.workout_id,
                            education_id: daily.education_id,
                        })),
                        {
                            transaction: transaction,
                        },
                    );
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
     * @param {number=} filter.authenticatedUser Authenticated user
     * @returns {Promise<PfPlans>} PfPlans instance
     * @throws {InternalServerError} If failed to get PF plan details
     */
    async getPfPlanDetails(id, filter) {
        try {
            let pfPlan = await this.database.models.PfPlans.findOne({
                nest: true,
                subQuery: false,
                attributes: [
                    'id',
                    'name',
                    'description',
                    'photo',
                    'is_premium',
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [[Sequelize.fn('COALESCE', Sequelize.col('is_favorite'), null, 0), 'is_favorite']]
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
                            exclude: ['deleted_at', 'pf_plan_id', 'workout_id', 'education_id', 'created_at', 'updated_at'],
                        },
                        include: [
                            {
                                model: this.database.models.Workouts,
                                as: 'workout',
                                required: false,
                                attributes: {
                                    exclude: ['deleted_at'],
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
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [
                              {
                                  model: this.database.models.UserFavoritePfPlans,
                                  as: 'user_favorite_pf_plans',
                                  attributes: [],
                                  required: false,
                                  where: {
                                      user_id: filter.authenticatedUser.user_id,
                                  },
                              },
                          ]
                        : []),
                ],
                order: [
                    [{ model: this.database.models.PfPlanDailies, as: 'pf_plan_dailies' }, 'day', 'ASC'],
                    [{ model: this.database.models.PfPlanDailies, as: 'pf_plan_dailies' }, 'id', 'ASC'],
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

            if (pfPlan.pf_plan_dailies) {
                const dailies = {};

                pfPlan.dataValues.pf_plan_dailies = pfPlan.dataValues.pf_plan_dailies.map((pfPlanDaily) => {
                    if (pfPlanDaily.dataValues.workout) {
                        pfPlanDaily.dataValues.workout.photo = this.helper.generateProtectedUrl(
                            pfPlanDaily.workout?.photo,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );
                    }

                    if (pfPlanDaily.dataValues.education) {
                        pfPlanDaily.dataValues.education.photo = this.helper.generateProtectedUrl(
                            pfPlanDaily.education?.photo,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );

                        pfPlanDaily.dataValues.education.media_upload = this.helper.generateProtectedUrl(
                            pfPlanDaily.education?.media_upload,
                            `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                            {
                                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                            },
                        );
                    }

                    dailies[`day_${pfPlanDaily.day}`] = dailies[`day_${pfPlanDaily.day}`] ?? {};

                    dailies[`day_${pfPlanDaily.day}`].contents = [
                        ...(dailies[`day_${pfPlanDaily.day}`]?.contents ?? []),
                        {
                            id: pfPlanDaily.id,
                            workout: pfPlanDaily.dataValues.workout,
                            education: pfPlanDaily.dataValues.education,
                        },
                    ];
                    return pfPlanDaily;
                });

                pfPlan = pfPlan.get({ plain: true });

                pfPlan.pf_plan_dailies = Object.keys(dailies).map((key) => ({
                    id: dailies[key].id,
                    day: Number(key.split('_')[1]),
                    contents: dailies[key].contents,
                }));
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
            return await this.database.models.UserPfPlans.create({ user_id: userId, pf_plan_id: id });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to select PF plan', error);
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
     * @returns {Promise<PfPlanDailies>} PfPlanDailies instance
     * @throws {InternalServerError} If failed to get PF plan content
     */
    async getPfPlanDailyById(pfPlanId, id) {
        try {
            return this.database.models.PfPlanDailies.findOne({ where: { id: id, pf_plan_id: pfPlanId } });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get PF plan content', error);
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
        try {
            const pfPlanDailyTotalContents = await this.database.models.PfPlanDailies.count({
                where: { pf_plan_id: pfPlanId, day: data.content.day },
            });

            const userPfPlanDailyLastProgress = await this.database.models.UserPfPlanDailyProgress.findOne({
                where: { user_id: data.userId, pf_plan_id: pfPlanId },
                order: [['id', 'DESC']],
            });

            let userPfPlanDailyProgress = await this.database.models.UserPfPlanDailyProgress.findOne({
                where: { user_id: data.userId, pf_plan_id: pfPlanId, pf_plan_daily_id: data.content.id },
            });

            let userPfPlanProgress = await this.database.models.UserPfPlanProgress.findOne({
                where: { user_id: data.userId, pf_plan_id: pfPlanId, day: data.content.day },
            });

            const userPfPlanLastProgress = await this.database.models.UserPfPlanProgress.findOne({
                where: { user_id: data.userId, pf_plan_id: pfPlanId },
                order: [['id', 'DESC']],
            });

            const pfPlanLastDay = await this.database.models.PfPlanDailies.findOne({ where: { pf_plan_id: pfPlanId }, order: [['day', 'DESC']] });

            let pfPlanDailyProgressFulfilledContent =
                (await this.database.models.UserPfPlanDailyProgress.count({
                    where: { user_id: data.userId, pf_plan_id: pfPlanId, is_fulfilled: true, day: data.content.day },
                })) + 1;

            let pfPlanProgressSkipped = userPfPlanDailyLastProgress?.skipped ?? 0;

            let isPfPlanContentFulfilled = true;
            if (data.isSkip) {
                pfPlanProgressSkipped += 1;
                isPfPlanContentFulfilled = false;
            }

            return await this.database.transaction(async (transaction) => {
                if (data.workoutExercise !== undefined) {
                    const totalWorkoutExercise = await this.database.models.WorkoutExercises.count({
                        where: { workout_id: data.workoutExercise.workout_id },
                    });

                    const userPfPlanWorkoutLastProgress = await this.database.models.UserPfPlanWorkoutProgress.findOne({
                        where: { user_id: data.userId, pf_plan_id: pfPlanId, workout_id: data.workoutExercise.workout_id },
                        order: [['id', 'DESC']],
                    });

                    const pfPlanWorkoutProgressFulfilled = (userPfPlanWorkoutLastProgress?.fulfilled ?? 0) + 1;

                    const pfPlanWorkoutProgress = await this.database.models.UserPfPlanWorkoutProgress.create(
                        {
                            user_id: data.userId,
                            pf_plan_id: pfPlanId,
                            workout_id: data.workoutExercise.workout_id,
                            workout_exercise_id: data.workoutExercise.id,
                            pf_plan_daily_id: data.content.id,
                            fulfilled: pfPlanWorkoutProgressFulfilled,
                            unfulfilled: totalWorkoutExercise - pfPlanWorkoutProgressFulfilled,
                            total_exercise: totalWorkoutExercise,
                        },
                        { transaction: transaction },
                    );

                    if (pfPlanWorkoutProgress.fulfilled < pfPlanWorkoutProgress.total_exercise) {
                        pfPlanDailyProgressFulfilledContent -= 1;
                        isPfPlanContentFulfilled = false;
                    }
                }

                [userPfPlanDailyProgress] = await this.database.models.UserPfPlanDailyProgress.upsert(
                    {
                        id: userPfPlanDailyProgress?.id,
                        user_id: data.userId,
                        pf_plan_id: pfPlanId,
                        pf_plan_daily_id: data.content.id,
                        day: data.content.day,
                        is_skip: data.isSkip,
                        is_fulfilled: isPfPlanContentFulfilled,
                        total_days: pfPlanLastDay.day,
                        fulfilled: pfPlanDailyProgressFulfilledContent,
                        unfulfilled: pfPlanDailyTotalContents - pfPlanDailyProgressFulfilledContent,
                        skipped: pfPlanProgressSkipped,
                        total_contents: pfPlanDailyTotalContents,
                    },
                    { transaction: transaction },
                );

                const pfPlanLastProgressFulfilled = userPfPlanLastProgress?.fulfilled ?? 0;

                const userPfPlanProgressFulfilled =
                    pfPlanDailyProgressFulfilledContent < pfPlanDailyTotalContents ? pfPlanLastProgressFulfilled : pfPlanLastProgressFulfilled + 1;

                [userPfPlanProgress] = await this.database.models.UserPfPlanProgress.upsert(
                    {
                        id: userPfPlanProgress?.id,
                        user_id: data.userId,
                        pf_plan_id: pfPlanId,
                        day: data.content.day,
                        fulfilled: userPfPlanProgressFulfilled,
                        unfulfilled: pfPlanLastDay.day - userPfPlanProgressFulfilled,
                        skipped: (userPfPlanLastProgress?.skipped ?? 0) + data.isSkip ? 1 : 0,
                    },
                    { transaction: transaction },
                );

                return userPfPlanProgress;
            });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to update PF plan progress.', error);
        }
    }
}
