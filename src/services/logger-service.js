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
}
