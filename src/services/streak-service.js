import * as dateFnsUtc from '@date-fns/utc';
import * as dateFns from 'date-fns';
import * as exceptions from '../exceptions/index.js';

export default class StreakService {
    constructor({ logger, database, helper }) {
        this.logger = logger;
        this.helper = helper;
        this.database = database;
    }

    /**
     * Create streak log and record
     *
     * @param {object} data
     * @param {number} data.userId User ID
     * @param {string} data.streakDate Date of the streak
     * @param {boolean} data.isWorkout Indicator if the streak origin is a workout
     * @param {boolean} data.isPfPlanDay Indicator if the streak origin is a PF plan day
     * @returns {Promise<UserStreaks>}
     * @throws {InternalServerError} Failed to create user streak
     */
    async createStreak(data) {
        try {
            const [streakLogExists, streakExist, lastStreak] = await Promise.all([
                this.database.models.UserStreakLogs.findOne({
                    where: {
                        user_id: data.userId,
                        streak_date: data.streakDate,
                        ...(data.isWorkout && { is_workout: data.isWorkout }),
                        ...(data.isPfPlanDay && { is_workout: data.isPfPlanDay }),
                    },
                }),
                this.database.models.UserStreaks.findOne({
                    where: {
                        user_id: data.userId,
                        last_streak_date: data.streakDate,
                    },
                }),
                this.database.models.UserStreaks.findOne({
                    where: {
                        user_id: data.userId,
                        last_streak_date: data.streakDate,
                    },
                    order: [['id', 'DESC']],
                }),
            ]);

            const hasYesterdayStreak = dateFns.isSameDay(
                lastStreak?.last_streak_date,
                new dateFnsUtc.UTCDate(dateFns.subDays(new dateFnsUtc.UTCDate(), 1)),
            );

            return await this.database.transaction(async (transaction) => {
                let streak = streakExist;

                if (!streakLogExists) {
                    await this.database.models.UserStreakLogs.create(
                        {
                            user_id: data.userId,
                            is_workout: data.isWorkout ?? false,
                            is_pf_plan_day: data.isPfPlanDay ?? false,
                            streak_date: data.streakDate,
                        },
                        {
                            transaction: transaction,
                        },
                    );
                }

                if (!streakExist) {
                    const currentStreak = hasYesterdayStreak ? (lastStreak?.current_streak ?? 0) + 1 : 1;

                    streak = await this.database.models.UserStreaks.create(
                        {
                            user_id: data.userId,
                            current_streak: currentStreak,
                            longest_streak: Math.max(currentStreak, lastStreak?.longest_streak ?? 0),
                            last_streak_date: lastStreak?.created_at ?? new dateFnsUtc.UTCDate(),
                        },
                        {
                            transaction: transaction,
                        },
                    );
                }

                return streak;
            });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to create user streak', error);
        }
    }

    /**
     * Get user latest streak record
     *
     * @param {number} userId User ID
     * @returns {Promise<UserStreaks>}
     * @throws {InternalServerError} Failed to get user streak
     */
    async getUserStreak(userId) {
        try {
            return await this.database.models.UserStreaks.findOne({
                attributes: {
                    exclude: ['deleted_at', 'created_at', 'updated_at'],
                },
                where: {
                    user_id: userId,
                },
                order: [['id', 'DESC']],
            });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get user streak', error);
        }
    }
}
