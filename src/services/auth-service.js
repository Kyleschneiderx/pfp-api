import * as exceptions from '../exceptions/index.js';

export default class AuthService {
    constructor({ logger, database, jwt, firebase }) {
        this.database = database;
        this.logger = logger;
        this.jwt = jwt;
        this.firebase = firebase;
    }

    /**
     * Generate session for authenticated user
     *
     * @param {Users} user User instance
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    async generateSession(user) {
        delete user.dataValues.password;
        delete user.dataValues.google_id;
        delete user.dataValues.apple_id;

        let token;
        try {
            token = this.jwt.generate(
                process.env.JWT_SECRET,
                { user: { user_id: user.id, account_type_id: user.account_type_id } },
                { algorithm: process.env.JWT_ALGORITHM },
            );
        } catch (error) {
            this.logger.error('Failed to generate JWT token.', error);

            throw new exceptions.InternalServerError('Failed to generate JWT token.', error);
        }

        return {
            user: user,
            token: {
                access: token.token,
                expires: token.expires,
            },
        };
    }

    /**
     * Verify social media id token
     * @param {string} idToken Social media authenticated id token
     * @returns {DecodedIdToken} Decoded social media id token
     * @throws {InternalServerError} If failed to verify social media id token
     */
    async verifySocialMediaIdToken(idToken) {
        try {
            return await this.firebase.verifyIdToken(idToken);
        } catch (error) {
            this.logger.error('Failed to verify id token.', error);

            throw new exceptions.InternalServerError('Failed to verify id token.', error);
        }
    }
}
