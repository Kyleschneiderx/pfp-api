import * as dateFns from 'date-fns';
import * as exceptions from '../exceptions/index.js';
import {
    AUTH_TOKEN_EXPIRATION_IN_MINUTES,
    DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
    RESET_PASSWORD_EXPIRATION_IN_SECONDS,
    USER_ACCOUNT_TYPE_ID,
} from '../constants/index.js';

export default class AuthService {
    constructor({ logger, database, jwt, ssoAuthentication }) {
        this.database = database;
        this.logger = logger;
        this.jwt = jwt;
        this.ssoAuthentication = ssoAuthentication;
    }

    /**
     * Generate session for authenticated user
     *
     * @param {Users} user User instance
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    generateSession(user) {
        let token;

        try {
            token = this.jwt.generate(
                process.env.JWT_SECRET,
                { user: { user_id: user.id, account_type_id: user.account_type_id } },
                {
                    algorithm: process.env.JWT_ALGORITHM,
                    expiration: user.account_type_id === USER_ACCOUNT_TYPE_ID ? 0 : AUTH_TOKEN_EXPIRATION_IN_MINUTES,
                },
            );
        } catch (error) {
            this.logger.error('Failed to generate JWT token.', error);

            throw new exceptions.InternalServerError('Failed to generate JWT token.', error);
        }

        return {
            access: token.token,
            expires: token.expires,
        };
    }

    /**
     * Generate reset password token for forgot password
     * @param {Users} user User instance
     * @returns {string} Reset password token
     * @throws {InternalServerError} If failed to generate JWT token
     * @throws {InternalServerError} If failed to record reset password request
     */
    async generateResetPasswordToken(user) {
        let token;
        try {
            token = this.jwt.generate(
                process.env.JWT_SECRET,
                {},
                { algorithm: process.env.JWT_ALGORITHM, expiration: AUTH_TOKEN_EXPIRATION_IN_MINUTES },
            );
        } catch (error) {
            this.logger.error('Failed to generate JWT token.', error);

            throw new exceptions.InternalServerError('Failed to generate JWT token.', error);
        }

        await this.createResetPasswordRequest({
            userId: user.id,
            reference: token.token,
            statusId: DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
        });

        return token.token;
    }

    /**
     * Get reset password request by token
     * @param {string} token Reset password token
     * @returns {Promise<ResetPasswordRequests>}
     * @throws {InternalServerError} If failed to get reset password request
     */
    async getResetPasswordByToken(token) {
        try {
            return this.database.models.ResetPasswordRequests.findOne({
                where: {
                    reference: token,
                    status_id: DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
                },
            });
        } catch (error) {
            this.logger.error('Failed to get reset password request.', error);

            throw new exceptions.InternalServerError('Failed to get reset password request.', error);
        }
    }

    /**
     * Create reset password request
     * @param {object} data
     * @param {number} data.userId User account user id
     * @param {string} data.reference Reset password reference
     * @param {number} data.statusId Reset password status id
     * @returns {Promise<ResetPasswordRequests>}
     * @throws {InternalServerError} If failed to record reset password request
     */
    async createResetPasswordRequest(data) {
        try {
            return await this.database.models.ResetPasswordRequests.create({
                user_id: data.userId,
                reference: data.reference,
                status_id: data.statusId,
            });
        } catch (error) {
            this.logger.error('Failed to record reset password request.', error);

            throw new exceptions.InternalServerError('Failed to record reset password request.', error);
        }
    }

    /**
     * Update reset password request status
     * @param {number} requestId Reset password request id
     * @param {number} statusId Status id to set
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to update reset password request status
     */
    async updateResetPasswordRequestStatus(requestId, statusId) {
        try {
            return this.database.models.ResetPasswordRequests.update({ status_id: statusId }, { where: { id: requestId } });
        } catch (error) {
            this.logger.error('Failed to update reset password request status.', error);

            throw new exceptions.InternalServerError('Failed to update reset password request status.', error);
        }
    }

    /**
     * Verify reset password request token
     *
     * @param {string} token Reset password request token
     * @returns {Promise<ResetPasswordRequest>}
     * @throws {InternalServerError} If failed to get reset password request
     * @throws {UnprocessableEntity} If token is invalid or expired
     */
    async verifyResetPasswordRequestReference(token, type = 'token') {
        const currentTime = new Date();
        let resetRequest;
        try {
            resetRequest = await this.database.models.ResetPasswordRequests.findOne({
                where: {
                    reference: token,
                    status_id: DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
                },
            });
        } catch (error) {
            this.logger.error('Failed to get reset password request.', error);

            throw new exceptions.InternalServerError('Failed to get reset password request.', error);
        }

        if (!resetRequest) {
            throw new exceptions.UnprocessableEntity(`Invalid ${type}.`);
        }

        const isCodeExpired = !dateFns.isWithinInterval(currentTime, {
            start: resetRequest.created_at,
            end: dateFns.add(resetRequest.created_at, { seconds: RESET_PASSWORD_EXPIRATION_IN_SECONDS }),
        });

        if (isCodeExpired) {
            throw new exceptions.UnprocessableEntity(`Expired ${type}.`);
        }

        return resetRequest;
    }

    /**
     * Verify social media id token
     * @param {string} idToken Social media authenticated id token
     * @returns {DecodedIdToken} Decoded social media id token
     * @throws {InternalServerError} If failed to verify social media id token
     */
    async verifySocialMediaIdToken(idToken) {
        try {
            return await this.ssoAuthentication.verifyIdToken(idToken);
        } catch (error) {
            this.logger.error('Failed to verify id token.', error);

            throw new exceptions.InternalServerError('Failed to verify id token.', error);
        }
    }
}
