import { Sequelize } from 'sequelize';
import * as dateFnsUtc from '@date-fns/utc';
import * as dateFnsTz from 'date-fns-tz';
import * as dateFns from 'date-fns';
import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class NotificationService {
    constructor({ logger, database, helper, pushNotification }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
        this.pushNotification = pushNotification;
    }

    /**
     * Send push notification to device
     *
     * @param {Notifications[]} notification Notifications instance
     * @returns {Promise<void>} void
     */
    async sendPushNotification(notifications) {
        try {
            await Promise.all(
                notifications.map(async (notification) => {
                    const userDeviceTokens = await this.database.models.UserDeviceTokens.findAll({
                        where: { ...(notification.user_id && { user_id: notification.user_id }) },
                    });

                    const notificationDescription = await this.database.models.NotificationDescriptions.findOne({
                        where: { id: notification.description_id },
                    });

                    if (notification.reference) {
                        notification.dataValues.reference = JSON.parse(notification.dataValues.reference);

                        notificationDescription.dataValues.description = this.helper.replacer(
                            notificationDescription.dataValues.description,
                            notification.dataValues.reference,
                        );
                    }

                    if (userDeviceTokens.length) {
                        const pushNotificationResult = await Promise.allSettled(
                            userDeviceTokens.map(async (deviceToken) =>
                                this.pushNotification.send({
                                    data: notification.reference,
                                    notification: {
                                        title: notificationDescription.title,
                                        body: notificationDescription.description,
                                    },
                                    token: deviceToken.token,
                                }),
                            ),
                        );

                        const deviceTokenToRemove = pushNotificationResult
                            .map((pushResult, index) => {
                                if (pushResult.status === 'rejected') return userDeviceTokens[index].id;

                                return [];
                            })
                            .flat();

                        await this.database.models.UserDeviceTokens.destroy({ where: { id: deviceTokenToRemove } });
                    }

                    return notification;
                }),
            );
        } catch (error) {
            this.logger.error('Failed to send push notification', error);
        }
    }

    /**
     * Create notification for user
     *
     * @param {object|object[]} data
     * @param {number=} data.userId User account id
     * @param {number} data.descriptionId Notification description id
     * @returns {Promise<Notifications|Notifications[]>} Notifications model instance
     */
    async createNotification(data) {
        data = Array.isArray(data) ? data : [data];

        let notification = null;
        try {
            notification = await this.database.models.Notifications.bulkCreate(
                data.map((payload) => ({
                    user_id: payload.userId,
                    description_id: payload.descriptionId,
                    reference: payload.reference,
                })),
            );

            this.sendPushNotification(notification);
        } catch (error) {
            this.logger.error('Failed to create notification.', error);
        }

        return Array.isArray(data) ? notification : notification[0];
    }

    /**
     * Get list of notifications
     *
     * @param {object} filter
     * @param {number} filter.userId User account id
     * @param {Array=} filter.sort Field and order to be use for sorting
     * @example [ [ {field}:{order} ] ]
     * @param {number=} filter.page Page for list to navigate
     * @param {number=} filter.pageItems Number of items return per page
     * @returns {Promise<{
     * data: Educations[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Educations isntance and pagination details
     * @throws {InternalServerError} If failed to get educations
     * @throws {NotFoundError} If no records found
     */
    async getNotifications(filter) {
        const lastNotificationIndicator = await this.database.models.UserRemovedNotificationIndicators.findOne({
            where: { user_id: filter.userId },
            order: [['id', 'DESC']],
        });

        const options = {
            nest: true,
            subQuery: false,
            limit: filter.pageItems,
            offset: filter.page * filter.pageItems - filter.pageItems,
            attributes: [
                'id',
                [Sequelize.col('notification_description.description'), 'description'],
                [Sequelize.col('notification_description.notification_type.value'), 'type'],
                'reference',
                'created_at',
                'updated_at',
            ],
            include: [
                {
                    model: this.database.models.NotificationDescriptions,
                    as: 'notification_description',
                    attributes: [],
                    include: [
                        {
                            model: this.database.models.NotificationTypes,
                            as: 'notification_type',
                            attributes: [],
                        },
                    ],
                    where: {},
                },
            ],
            order: [['id', 'DESC']],
            where: {
                [Sequelize.Op.or]: [
                    {
                        user_id: filter.userId,
                    },
                    {
                        user_id: null,
                    },
                ],
                id: {
                    [Sequelize.Op.gt]: lastNotificationIndicator?.notification_id ?? 0,
                },
            },
        };

        if (filter.sort !== undefined) {
            options.order = this.helper.parseSortList(
                filter.sort,
                {
                    id: undefined,
                },
                this.database,
            );
        }

        let count;
        let rows;
        try {
            ({ count, rows } = await this.database.models.Notifications.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get notifications', error);
        }

        if (!rows.length) throw new exceptions.NotFound('No records found.');

        rows = rows.map((row) => {
            try {
                row.dataValues.reference = JSON.parse(row.dataValues.reference);
            } catch (error) {
                /** empty */
            }

            if (row.reference) {
                row.dataValues.description = this.helper.replacer(row.dataValues.description, row.dataValues.reference);
            }

            delete row.dataValues.reference;

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
     * Remove user notifications
     *
     * @param {number} userId User account id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to remove notifications
     */
    async removeUserNotifications(userId) {
        try {
            const lastNotification = await this.database.models.Notifications.findOne({ order: [['id', 'DESC']] });

            await this.database.models.UserRemovedNotificationIndicators.create({
                user_id: userId,
                notification_id: lastNotification.id,
            });

            await this.database.models.Notifications.destroy({
                where: {
                    user_id: userId,
                },
            });
        } catch (error) {
            this.logger.error('Failed to remove notifications.', error);

            throw new exceptions.InternalServerError('Failed to remove notifications', error);
        }
    }

    /**
     * Add user device token
     *
     * @param {number} userId User account id
     * @param {string} deviceToken Device token
     * @returns {Promise<UserDeviceTokens>}
     * @throws {InternalServerError} If failed to add device token
     */
    async addUserDeviceToken(userId, deviceToken) {
        if (deviceToken === null || deviceToken === '') return null;

        try {
            return await this.database.transaction(async (transaction) => {
                let userDeviceToken = await this.database.models.UserDeviceTokens.findOne({ where: { token: deviceToken } });

                if (userDeviceToken && userDeviceToken.user_id !== userId) {
                    await this.database.models.UserDeviceTokens.destroy({ where: { id: userDeviceToken.id } }, { transaction: transaction });

                    userDeviceToken = null;
                }

                [userDeviceToken] = await this.database.models.UserDeviceTokens.upsert(
                    {
                        id: userDeviceToken?.id,
                        user_id: userId,
                        token: deviceToken,
                    },
                    { transaction: transaction },
                );

                return userDeviceToken;
            });
        } catch (error) {
            this.logger.error('Failed to add device token.', error);

            throw new exceptions.InternalServerError('Failed to add device token', error);
        }
    }

    /**
     * Update user notification settings
     *
     * @param {number} userId User account id
     * @param {object} data
     * @param {boolean} data.isEnable Notification state
     * @param {string} data.time Desired time to be notified daily
     * @param {string} data.timezone Desired timezone for the time
     * @returns {Promise<UserNotificationSettings>}
     * @throws {InternalServerError} If failed to update notification settings
     */
    async updateUserNotificationSettings(userId, data) {
        try {
            let userSetting = await this.database.models.UserNotificationSettings.findOne({ where: { user_id: userId } });

            const timezoneDate = dateFnsTz.format(dateFnsTz.toZonedTime(new dateFnsUtc.UTCDate(), data.timezone), DATE_FORMAT, {
                timeZone: data.timezone,
            });

            const utcDateTime = dateFnsTz.fromZonedTime(new dateFnsUtc.UTCDate(`${timezoneDate} ${data.time}`), data.timezone);

            const utcTime = dateFns.format(new dateFnsUtc.UTCDate(utcDateTime), TIME_FORMAT);

            [userSetting] = await this.database.models.UserNotificationSettings.upsert({
                id: userSetting?.id,
                user_id: userId,
                is_enable: data.isEnable,
                time: data.time,
                time_utc: utcTime,
                timezone: data.timezone,
            });

            delete userSetting.dataValues.time_utc;

            return userSetting;
        } catch (error) {
            this.logger.error('Failed to update notification settings.', error);

            throw new exceptions.InternalServerError('Failed to update notification settings', error);
        }
    }

    /**
     * Get user notification settings
     *
     * @param {number} userId User account id
     * @returns {Promise<UserNotificationSettings>}
     * @throws {InternalServerError} If failed to get notification settings
     */
    async getUserNotificationSettings(userId) {
        try {
            return await this.database.models.UserNotificationSettings.findOne({
                attributes: { exclude: ['time_utc', 'deleted_at'] },
                where: { user_id: userId },
            });
        } catch (error) {
            this.logger.error('Failed to get notification settings.', error);

            throw new exceptions.InternalServerError('Failed to get notification settings', error);
        }
    }
}
