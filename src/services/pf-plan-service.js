import { Sequelize } from 'sequelize';
import {
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    PUBLISHED_PF_PLAN_STATUS_ID,
    PFPLAN_PHOTO_PATH,
    ASSET_URL,
    S3_OBJECT_URL,
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
     * @param {boolean=} data.isPremium PF plan premium indicator
     * @param {object[]=} data.exercises PF plan exercises
     * @param {number} data.exercises[].exercise_id PF plan exercise name
     * @param {number} data.exercises[].sets PF plan exercise number of sets
     * @param {number} data.exercises[].reps PF plan exercise number of reps
     * @param {number} data.exercises[].hold PF plan exercise hold time
     * @returns {Promise<PfPlans>} PF plans model instance
     * @throws {InternalServerError} If failed to update pf plan
     */
    async updatePfPlan(data) {
        try {
            const plfPlan = await this.database.models.PfPlans.findOne({ where: { id: data.id } });

            plfPlan.name = data.name;

            plfPlan.description = data.description;

            plfPlan.is_premium = data.isPremium;

            plfPlan.status_id = data.exercises ? PUBLISHED_PF_PLAN_STATUS_ID : plfPlan.status_id;

            await plfPlan.save();

            await plfPlan.reload();

            delete plfPlan.dataValues.deleted_at;

            if (data.exercises) {
                await this.database.transaction(async (transaction) => {
                    await this.database.models.PfPlanExercises.destroy({ where: { plfPlan: plfPlan.id }, transaction: transaction });

                    await this.database.models.PfPlanExercises.bulkCreate(
                        data.exercises.map((exercise) => ({
                            workout_id: plfPlan.id,
                            exercise_id: exercise.exercise_id,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            hold: exercise.hold,
                        })),
                        {
                            transaction: transaction,
                        },
                    );
                });
            }

            return plfPlan;
        } catch (error) {
            this.logger.error('Failed to update pf plan.', error);

            throw new exceptions.InternalServerError('Failed to update pf plan', error);
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
                ...(filter.statusId && { status_id: { [Sequelize.Op.like]: `%${filter.statusId}%` } }),
            },
        };

        if (filter.sort !== undefined) {
            options.order = this.helper.parseSortList(
                filter.sort,
                {
                    id: undefined,
                    name: undefined,
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
     * @throws {InternalServerError} If failed to get pf plans
     * @throws {NotFoundError} If no records found
     */
    async getPfPlanDetails(id) {
        try {
            const pfPlan = await this.database.models.PfPlans.findOne({
                nest: true,
                subQuery: false,
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
                        model: this.database.models.PfPlanExercises,
                        as: 'pf_plan_exercises',
                        required: false,
                        attributes: {
                            exclude: ['deleted_at', 'pf_plan_id', 'day', 'created_at', 'updated_at', 'exercise_id'],
                        },
                        include: [
                            {
                                model: this.database.models.Exercises,
                                as: 'exercise',
                                attributes: {
                                    exclude: ['deleted_at', 'updated_at', 'created_at', 'category_id', 'sets', 'reps', 'hold'],
                                },
                                where: {},
                                include: [
                                    {
                                        model: this.database.models.ExerciseCategories,
                                        as: 'exercise_category',
                                        attributes: {
                                            exclude: ['deleted_at', 'updated_at', 'created_at'],
                                        },
                                        where: {},
                                    },
                                ],
                            },
                        ],
                        order: [['id', 'DESC']],
                    },
                ],
                order: [['id', 'DESC']],
                where: {
                    id: id,
                },
            });

            if (pfPlan.pf_plan_exercises) {
                pfPlan.dataValues.pf_plan_exercises = pfPlan.dataValues.pf_plan_exercises.map((pfPlanExercise) => {
                    pfPlanExercise.exercise.photo = this.helper.generateProtectedUrl(
                        pfPlanExercise.exercise.photo,
                        `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                        {
                            expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                        },
                    );

                    pfPlanExercise.exercise.video = this.helper.generateProtectedUrl(
                        pfPlanExercise.exercise.video,
                        `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                        {
                            expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                        },
                    );

                    return pfPlanExercise;
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
     * @returns {boolean}
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
}
