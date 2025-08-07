import { Sequelize } from 'sequelize';
import * as dateFns from 'date-fns';
import * as dateFnsUtc from '@date-fns/utc';
import {
    DATE_FORMAT,
    DATETIME_FORMAT,
    FIRESTORE_COLLECTIONS,
    FREE_USER_TYPE_ID,
    MONTHLY_PERIOD_LABEL_FORMAT,
    MONTHLY_PERIOD_UNIT,
    PAGES_TO_TRACK,
    PREMIUM_USER_TYPE_ID,
    USER_ACCOUNT_TYPE_ID,
    WEEKLY_PERIOD,
    WEEKLY_PERIOD_LABEL_FORMAT,
    WEEKLY_PERIOD_UNIT,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class StatsService {
    constructor({ logger, database, helper, fireStore }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
        this.fireStore = fireStore;
    }

    /**
     * Get user summary
     *
     * @param {object} filter
     * @param {string=} filter.dateFrom Start date
     * @param {string=} filter.dateTo End date
     * @returns {Promise<{
     * total_users: number,
     * periodic_summary: {
     *   [key: string]: {
     *      free: number,
     *      premium: number
     *  }
     * },
     * unique_signups: {
     *  free: number,
     *  premium: number
     *
     * }
     * }>}
     * @throws {InternalServerError} If failed to get users summary
     */
    async getUserSummary(filter) {
        try {
            let periodUnit = MONTHLY_PERIOD_UNIT;

            let periodLabelFormat = MONTHLY_PERIOD_LABEL_FORMAT;

            if (filter.period === WEEKLY_PERIOD) {
                periodUnit = WEEKLY_PERIOD_UNIT;

                periodLabelFormat = WEEKLY_PERIOD_LABEL_FORMAT;
            }

            const endDate = new Date(dateFns.format(filter.dateTo, DATE_FORMAT));

            const startDate = new Date(dateFns.format(filter.dateFrom, DATE_FORMAT));

            const summaryDate = [];

            for (let loopDate = startDate; loopDate <= endDate; loopDate = dateFns.add(loopDate, { [periodUnit]: 1 })) {
                let reformatLoopDate = loopDate;

                if (filter.period !== WEEKLY_PERIOD) {
                    reformatLoopDate = dateFns.startOfMonth(loopDate);
                }

                summaryDate.push({
                    start: dateFns.format(reformatLoopDate, DATE_FORMAT),
                    end: dateFns.format(filter.period !== WEEKLY_PERIOD ? dateFns.endOfMonth(reformatLoopDate) : reformatLoopDate, DATE_FORMAT),
                });
            }

            const summary = {};

            const summaryDateData = await Promise.all(
                summaryDate.map(async (date) =>
                    this.database.models.Users.findAll({
                        attributes: ['type_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                        group: ['type_id'],
                        where: {
                            account_type_id: USER_ACCOUNT_TYPE_ID,
                            created_at: {
                                [Sequelize.Op.gte]: dateFns.startOfDay(new dateFnsUtc.UTCDate(date.start)),
                                [Sequelize.Op.lte]: dateFns.endOfDay(new dateFnsUtc.UTCDate(date.end)),
                            },
                        },
                        raw: true,
                    }),
                ),
            );

            summaryDateData.forEach((dateData, index) => {
                summary[dateFns.format(summaryDate[index].start, periodLabelFormat)] = {
                    free: dateData.find((item) => item.type_id === FREE_USER_TYPE_ID)?.count || 0,
                    premium: dateData.find((item) => item.type_id === PREMIUM_USER_TYPE_ID)?.count || 0,
                };
            });

            const uniqueSignupData = await this.database.models.Users.findAll({
                attributes: ['type_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['type_id'],
                where: {
                    account_type_id: USER_ACCOUNT_TYPE_ID,
                    created_at: {
                        [Sequelize.Op.gte]: dateFns.startOfDay(new dateFnsUtc.UTCDate()),
                        [Sequelize.Op.lte]: dateFns.endOfDay(new dateFnsUtc.UTCDate()),
                    },
                },
                raw: true,
            });

            const uniqueSignup = {
                free: uniqueSignupData.find((item) => item.type_id === FREE_USER_TYPE_ID)?.count || 0,
                premium: uniqueSignupData.find((item) => item.type_id === PREMIUM_USER_TYPE_ID)?.count || 0,
            };

            uniqueSignup.total = uniqueSignup.free + uniqueSignup.premium;

            return {
                total_users: await this.database.models.Users.count({ where: { account_type_id: USER_ACCOUNT_TYPE_ID } }),
                periodic_summary: summary,
                unique_signups: uniqueSignup,
            };
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get users summary', error);
        }
    }

    /**
     * Get page visits statistics
     *
     * @param {object} filter
     * @param {string=} filter.dateFrom Start date
     * @param {string=} filter.dateTo End date
     * @returns {<Promise<{
     *  total: number,
     *  pages: {
     *     page: string,
     *     label: string,
     *     total: number,
     *     percentage: number
     *  }[]
     * }>}
     * @throws {InternalServerError} Failed to get page visit stats
     *
     */
    async getPageVisitStats(filter) {
        try {
            const stats = await this.database.models.PageVisits.findAll({
                attributes: ['page', [Sequelize.fn('COUNT', '1'), 'total']],
                where: {
                    created_at: {
                        [Sequelize.Op.gte]: dateFns.format(new Date(`${filter.dateFrom}T00:00:00.000Z`), DATETIME_FORMAT),
                        [Sequelize.Op.lte]: dateFns.format(new Date(`${filter.dateTo}T23:59:59.000Z`), DATETIME_FORMAT),
                    },
                },
                group: ['page'],
            });

            const totalDevice = stats.find((stat) => stat.page === PAGES_TO_TRACK.WELCOME)?.total;

            const pagesToTrack = {};

            Object.keys(PAGES_TO_TRACK).forEach((key) => {
                if (PAGES_TO_TRACK[key] !== PAGES_TO_TRACK.WELCOME) {
                    pagesToTrack[PAGES_TO_TRACK[key]] = {
                        label: key,
                        total: 0,
                    };
                }
            });

            stats.forEach((stat) => {
                if (stat.page !== PAGES_TO_TRACK.WELCOME) {
                    pagesToTrack[stat.page].total = stat.total;
                }
            });

            return {
                total: totalDevice ?? 0,
                pages: Object.keys(pagesToTrack).map((page) => ({
                    page: page,
                    label: pagesToTrack[page].label,
                    total: pagesToTrack[page].total,
                    percentage: totalDevice ? Math.round((pagesToTrack[page].total / totalDevice) * 100) : 0,
                })),
            };
        } catch (error) {
            this.logger.error('Failed to get page visit stats.', error);

            throw new exceptions.InternalServerError('Failed to get page visit stats.', error);
        }
    }

    /**
     * Get user message on ai coach statistics
     *
     * @param {object} filter
     * @param {string=} filter.dateFrom Start date
     * @param {string=} filter.dateTo End date
     * @returns {<Promise<{
     *  total: number,
     *  pages: {
     *     page: string,
     *     label: string,
     *     total: number,
     *     percentage: number
     *  }[]
     * }>}
     * @throws {InternalServerError} Failed to get page visit stats
     *
     */
    async getAiUserMessage(filter) {
        try {
            const dateRanges = this.helper.splitDateRangeIntoChunks(
                new Date(`${filter.dateFrom}T00:00:00.000Z`),
                new Date(`${filter.dateTo}T23:59:59.000Z`),
                7,
            );

            const statistics = await Promise.all(
                dateRanges.map(async (dateRange) => {
                    const messages = await this.fireStore
                        .collectionGroup(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                        .where('parentCollection', '==', FIRESTORE_COLLECTIONS.ROOMS_AI)
                        .where('senderId', '!=', null)
                        .where('createdAt', '>=', new Date(`${dateRange.start}T00:00:00.000Z`).getTime())
                        .where('createdAt', '<=', new Date(`${dateRange.end}T23:59:59.000Z`).getTime())
                        .count()
                        .get();

                    return { ...dateRange, count: messages.data().count };
                }),
            );

            const statisticsMap = {};
            let totalCount = 0;

            statistics.forEach((stat) => {
                statisticsMap[stat.end] = stat.count;
                totalCount += stat.count;
            });

            return {
                total: totalCount,
                stats: statisticsMap,
            };
        } catch (error) {
            this.logger.error('Failed to get user coach prompt stats.', error);
            throw new exceptions.InternalServerError('Failed to get user coach prompt stats.', error);
        }
    }
}
