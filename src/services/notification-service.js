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
    async sendPushNotification(notification) {}

    /**
     * Create notification for user
     *
     * @param {Users} user User instance
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    async createNotification(data) {
        let notification = null;
        try {
            notification = await this.database.models.Notifications.create(data);
        } catch (error) {
            this.logger.error('Failed to create notification.', error);
        }

        return notification;
    }
}
