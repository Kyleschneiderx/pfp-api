import * as exceptions from '../exceptions/index.js';
import * as constants from '../constants/index.js';

export default class AuthService {
    constructor({ logger, database, jwt, password, userService }) {
        this.database = database;
        this.logger = logger;
        this.jwt = jwt;
        this.password = password;
        this.userService = userService;
    }

    /**
     * Authenticate admin credential
     *
     * @param {object} data
     * @param {string} data.email User account email address
     * @param {string} data.password User account password
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {UnprocessableContent} If user credential is invalid
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    async authenticateAdmin(data) {
        const userInfo = await this.userService.getUser({ email: data.email, account_type_id: constants.ADMIN_ACCOUNT_TYPE_ID });

        if (!userInfo) {
            throw new exceptions.UnprocessableContent('Incorrect email or password');
        }

        if (!this.password.verify(data.password, userInfo.password)) {
            throw new exceptions.UnprocessableContent('Incorrect email or password');
        }

        delete userInfo.dataValues.password;
        delete userInfo.dataValues.google_id;
        delete userInfo.dataValues.apple_id;

        const token = this.jwt.generate(
            process.env.JWT_SECRET,
            { user: { user_id: userInfo.id, account_type_id: userInfo.account_type_id } },
            { algorithm: process.env.JWT_ALGORITHM },
        );

        await this.userService.updateUserLastLogin(userInfo.id);

        return {
            user: userInfo,
            token: {
                access: token.token,
                expires: token.expires,
            },
        };
    }

    /**
     * Authenticate user credential
     *
     * @param {object} data
     * @param {string=} data.google_id User account google id. Required if user is authenticating using google account
     * @param {string=} data.apple_id User account apple id. Required if user is authenticating using apple account
     * @param {string=} data.email User account email address
     * @param {string=} data.password User account password
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {UnprocessableContent} If user credential is invalid
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    async authenticateUser(data) {
        const userInfo = await this.userService.getUser({ email: data.email, account_type_id: constants.USER_ACCOUNT_TYPE_ID });

        if (!userInfo) {
            throw new exceptions.UnprocessableContent('Incorrect email or password');
        }

        if (!this.password.verify(data.password, userInfo.password)) {
            throw new exceptions.UnprocessableContent('Incorrect email or password');
        }

        delete userInfo.dataValues.password;
        delete userInfo.dataValues.google_id;
        delete userInfo.dataValues.apple_id;

        const token = this.jwt.generate(
            process.env.JWT_SECRET,
            { user: { user_id: userInfo.id, account_type_id: userInfo.account_type_id } },
            { algorithm: process.env.JWT_ALGORITHM },
        );

        await this.userService.updateUserLastLogin(userInfo.id);

        return {
            user: userInfo,
            token: {
                access: token.token,
                expires: token.expires,
            },
        };
    }
}
