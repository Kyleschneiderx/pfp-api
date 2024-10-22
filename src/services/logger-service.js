export default class LoggerService {
    constructor({ logger, database }) {
        this.database = database;
        this.logger = logger;
    }

    /**
     * Generate session for authenticated user
     *
     * @param {Users} user User instance
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    async logApiRequest(log) {
        let apiLog;
        try {
            apiLog = this.database.models.ApiLogs.create(log);
        } catch (error) {
            this.logger.error('Failed to log api request.', error);
        }

        return apiLog;
    }

    /**
     * Generate system audit log
     *
     * @param {number} descriptionId System audit description id
     * @param {object} data
     * @returns {Promise<void>}
     */
    async logSystemAudit(userId, descriptionId) {
        let audit;
        try {
            audit = this.database.models.SystemAudits.create({
                user_id: userId,
                description_id: descriptionId,
            });
        } catch (error) {
            this.logger.error('Failed to log system aud.', error);
        }

        return audit;
    }
}
