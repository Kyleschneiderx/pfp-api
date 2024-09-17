import { Sequelize } from 'sequelize';
import { ASSET_URL, DRAFT_WORKOUT_STATUS_ID } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class WorkoutService {
    constructor({ logger, database, helper }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
    }

    /**
     * Create workout
     * @param {object} data
     * @param {string} data.name Workout name
     * @param {string} data.description Workout description
     * @param {object[]} data.exercises Workout exercises
     * @param {number} data.exercises[].exercise_id Workout exercise name
     * @param {number} data.exercises[].sets Workout exercise number of sets
     * @param {number} data.exercises[].reps Workout exercise number of reps
     * @param {number} data.exercises[].hold Workout exercise hold time
     * @returns {Promise<Workouts>} Workouts model instance
     * @throws {InternalServerError} If failed to create exercise
     */
    async createWorkout(data) {
        try {
            const workoutDetails = await this.database.transaction(async (transaction) => {
                const workout = await this.database.models.Workouts.create(
                    {
                        name: data.name,
                        description: data.description,
                        status_id: DRAFT_WORKOUT_STATUS_ID,
                    },
                    {
                        transaction: transaction,
                    },
                );

                await this.database.models.WorkoutDays.bulkCreate(
                    data.exercises.map((exercise) => ({
                        workout_id: workout.id,
                        exercise_id: exercise.exercise_id,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        hold: exercise.hold,
                    })),
                    { transaction: transaction },
                );

                return workout;
            });

            return workoutDetails;
        } catch (error) {
            this.logger.error('Failed to create workout.', error);

            throw new exceptions.InternalServerError('Failed to create workout', error);
        }
    }
}
