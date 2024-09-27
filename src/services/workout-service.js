import { Sequelize } from 'sequelize';
import {
    ADMIN_ACCOUNT_TYPE_ID,
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    WORKOUT_PHOTO_PATH,
    ASSET_URL,
    S3_OBJECT_URL,
    PUBLISHED_WORKOUT_STATUS_ID,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class WorkoutService {
    constructor({ logger, database, helper, storage }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
        this.storage = storage;
    }

    /**
     * Create workout
     * @param {object} data
     * @param {string} data.name Workout name
     * @param {string} data.description Workout description
     * @param {number} data.statusId Workout status id
     * @param {object} data.photo Workout photo
     * @param {boolean} data.isPremium Workout premium indicator
     * @param {object[]=} data.exercises Workout exercises
     * @param {number} data.exercises[].exercise_id Workout exercise name
     * @param {number} data.exercises[].sets Workout exercise number of sets
     * @param {number} data.exercises[].reps Workout exercise number of reps
     * @param {number} data.exercises[].hold Workout exercise hold time
     * @returns {Promise<Workouts>} Workouts model instance
     * @throws {InternalServerError} If failed to create workout
     */
    async createWorkout(data) {
        try {
            let storeResponse;
            if (data.photo !== undefined) {
                storeResponse = await this.storage.store(data.photo.name, data.photo.data, WORKOUT_PHOTO_PATH, {
                    contentType: data.photo.mimetype,
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            return await this.database.transaction(async (transaction) => {
                const workout = await this.database.models.Workouts.create(
                    {
                        name: data.name,
                        description: data.description,
                        photo: storeResponse?.path ? `${ASSET_URL}/${storeResponse?.path}` : null,
                        is_premium: data.isPremium,
                        status_id: data.statusId,
                    },
                    { transaction: transaction },
                );

                workout.photo = this.helper.generateProtectedUrl(workout.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                });

                if (data.exercises) {
                    await this.database.models.WorkoutExercises.bulkCreate(
                        data.exercises.map((exercise) => ({
                            workout_id: workout.id,
                            exercise_id: exercise.exercise_id,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            hold: exercise.hold,
                        })),
                        {
                            transaction: transaction,
                        },
                    );
                }

                return workout;
            });
        } catch (error) {
            this.logger.error('Failed to create workout.', error);

            throw new exceptions.InternalServerError('Failed to create workout', error);
        }
    }

    /**
     * Update workout
     * @param {object} data
     * @param {number} data.id Workout id
     * @param {string=} data.name Workout name
     * @param {string=} data.description Workout description
     * @param {object=} data.photo Workout photo
     * @param {number=} data.statusId Workout status id
     * @param {boolean=} data.isPremium Workout premium indicator
     * @param {object[]=} data.exercises Workout exercises
     * @param {number} data.exercises[].exercise_id Workout exercise name
     * @param {number} data.exercises[].sets Workout exercise number of sets
     * @param {number} data.exercises[].reps Workout exercise number of reps
     * @param {number} data.exercises[].hold Workout exercise hold time
     * @returns {Promise<Workouts>} Workouts model instance
     * @throws {InternalServerError} If failed to update exercise
     */
    async updateWorkout(data) {
        try {
            let storeResponse;
            if (data.photo !== undefined) {
                storeResponse = await this.storage.store(data.photo.name, data.photo.data, WORKOUT_PHOTO_PATH, {
                    contentType: data.photo.mimetype,
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            const workout = await this.database.models.Workouts.findOne({ where: { id: data.id } });

            const oldPhoto = workout.photo;

            workout.name = data.name;

            workout.description = data.description;

            workout.photo = storeResponse?.path ? `${ASSET_URL}/${storeResponse?.path}` : undefined;

            workout.is_premium = data.isPremium;

            workout.status_id = data.statusId;

            await workout.save();

            await workout.reload();

            if (storeResponse?.path && oldPhoto) {
                await this.storage.delete(oldPhoto.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            workout.photo = this.helper.generateProtectedUrl(workout.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            delete workout.dataValues.deleted_at;

            if (data.exercises) {
                await this.database.transaction(async (transaction) => {
                    await this.database.models.WorkoutExercises.destroy({ where: { workout_id: workout.id }, transaction: transaction });

                    await this.database.models.WorkoutExercises.bulkCreate(
                        data.exercises.map((exercise) => ({
                            workout_id: workout.id,
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

            return workout;
        } catch (error) {
            this.logger.error('Failed to update workout.', error);

            throw new exceptions.InternalServerError('Failed to update workout', error);
        }
    }

    /**
     * Get list of workouts
     *
     * @param {object} filter
     * @param {string=} filter.id Workout id
     * @param {string=} filter.name Workout name
     * @param {string=} filter.statusId Workout status id
     * @param {Array=} filter.sort Field and order to be use for sorting
     * @example [ [ {field}:{order} ] ]
     * @param {number=} filter.page Page for list to navigate
     * @param {number=} filter.pageItems Number of items return per page
     * @returns {Promise<{
     * data: Workouts[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Workouts isntance and pagination details
     * @throws {InternalServerError} If failed to get workouts
     * @throws {NotFoundError} If no records found
     */
    async getWorkouts(filter) {
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
            ({ count, rows } = await this.database.models.Workouts.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get workouts', error);
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
     * Get workout details including all exercises in it
     *
     * @param {number} id Workout id
     * @param {object} filter
     * @param {number=} filter.statusId Workout status id
     * @param {number=} filter.authenticatedUser Authenticated user
     * @throws {InternalServerError} If failed to get workouts
     * @throws {NotFoundError} If no records found
     */
    async getWorkoutDetails(id, filter) {
        try {
            const workout = await this.database.models.Workouts.findOne({
                nest: true,
                subQuery: false,
                attributes: [
                    'id',
                    'name',
                    'description',
                    'photo',
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
                        model: this.database.models.WorkoutExercises,
                        as: 'workout_exercises',
                        required: false,
                        attributes: {
                            exclude: ['deleted_at', 'workout_id', 'day', 'created_at', 'updated_at', 'exercise_id'],
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
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [
                              {
                                  model: this.database.models.UserFavoriteWorkouts,
                                  as: 'user_favorite_workouts',
                                  attributes: [],
                                  required: false,
                                  where: {
                                      user_id: filter.authenticatedUser.user_id,
                                  },
                              },
                          ]
                        : []),
                ],
                order: [['id', 'DESC']],
                where: {
                    id: id,
                    ...(filter.statusId && { status_id: filter.statusId }),
                },
            });

            workout.photo = this.helper.generateProtectedUrl(workout.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            if (workout.dataValues.is_favorite) {
                workout.dataValues.is_favorite = Boolean(workout.dataValues.is_favorite);
            }

            if (workout.workout_exercises) {
                workout.dataValues.workout_exercises = workout.dataValues.workout_exercises.map((workoutExercise) => {
                    workoutExercise.exercise.photo = this.helper.generateProtectedUrl(
                        workoutExercise.exercise.photo,
                        `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                        {
                            expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                        },
                    );

                    workoutExercise.exercise.video = this.helper.generateProtectedUrl(
                        workoutExercise.exercise.video,
                        `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                        {
                            expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                        },
                    );

                    return workoutExercise;
                });
            }

            return workout;
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get workout details', error);
        }
    }

    /**
     * Remove workout
     *
     * @param {number} id workout id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to remove workout
     */
    async removeWorkout(id) {
        try {
            const workout = await this.database.models.Workouts.findOne({ where: { id: id } });

            if (workout.photo) {
                await this.storage.delete(workout.photo.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }
            return await workout.destroy();
        } catch (error) {
            this.logger.error('Failed to remove workout', error);

            throw new exceptions.InternalServerError('Failed to remove workout', error);
        }
    }

    /**
     * Check if workout exist using id
     *
     * @param {number} id Workout id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check workout by id
     */
    async isWorkoutExistById(id) {
        try {
            return Boolean(await this.database.models.Workouts.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check workout', error);
        }
    }

    /**
     * Check if published workout exist using id
     *
     * @param {number} id Workout id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check workout by id
     */
    async isPublishedWorkoutExistById(id) {
        try {
            return Boolean(await this.database.models.Workouts.count({ where: { id: id, status_id: PUBLISHED_WORKOUT_STATUS_ID } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check published workout', error);
        }
    }

    /**
     * Update user workout favorite status
     *
     * @param {number} userId User account id
     * @param {number} workoutId Workout id
     * @param {boolean} favoriteStatus Workout favorite status
     * @throws {InternalServerError} If failed to update favorite workouts
     * @returns {Promise<UserFavoriteWorkouts>} UserFavoriteWorkouts instance
     */
    async updateUserFavoriteWorkouts(userId, workoutId, favoriteStatus) {
        try {
            const [userWorkoutFavorite, createdUserWorkoutFavorite] = await this.database.models.UserFavoriteWorkouts.findOrCreate({
                where: {
                    user_id: userId,
                    workout_id: workoutId,
                },
                defaults: {
                    user_id: userId,
                    workout_id: workoutId,
                    is_favorite: favoriteStatus,
                },
            });

            if (userWorkoutFavorite) {
                userWorkoutFavorite.is_favorite = favoriteStatus;

                await userWorkoutFavorite.save();
            }

            return userWorkoutFavorite ?? createdUserWorkoutFavorite;
        } catch (error) {
            this.logger.error('Failed to update favorite workouts.', error);

            throw new exceptions.InternalServerError('Failed to update favorite workouts.', error);
        }
    }

    /**
     * Get favorite workouts for user
     *
     * @param {object} filter
     * @param {number} filter.userId User account user id
     * @param {number} filter.page Page number
     * @param {number} filter.pageItems Items per page
     * @returns {Promise<{
     * data: Workouts[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Workouts instance and pagination details
     * @throws {InternalServerError} If failed to get favorite workouts
     * @throws {NotFoundError} If no records found
     */
    async getFavoriteWorkouts(filter) {
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
                    model: this.database.models.UserFavoriteWorkouts,
                    as: 'user_favorite_workouts',
                    required: true,
                    attributes: [],
                    where: {
                        user_id: filter.userId,
                        is_favorite: true,
                    },
                },
            ],
            order: [['id', 'DESC']],
            where: {},
        };

        let count;
        let rows;
        try {
            ({ count, rows } = await this.database.models.Workouts.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get favorite workouts', error);
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
}
