export default class NotificationService {
    constructor({ logger, database, pushNotification }) {
        this.database = database;
        this.logger = logger;
        this.pushNotification = pushNotification;
    }

    /**
     * Send push notification to device
     *
     * @param {*} notification
     */
    async sendPushNotification(notification) {
        console.log('sendPushNotification', notification);
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
}
