import * as exceptions from '../exceptions/index.js';

export default class AuthService {
    constructor({ logger, database, jwt, password, userService }) {
        this.database = database;
        this.logger = logger;
        this.jwt = jwt;
        this.password = password;
        this.userService = userService;
    }

    /**
     * Authenticate user account
     *
     * @param {object} data
     * @param {number} data.accountTypeId User account type id
     * @param {string=} data.googleId User account google id. Required if user is authenticating using google account
     * @param {string=} data.appleId User account apple id. Required if user is authenticating using apple account
     * @param {string=} data.email User account email address
     * @param {string=} data.password User account password
     * @returns {{ user: object, token: { token: string, expires: number }}} Authenticated user object
     * @throws {UnprocessableContent} If user credential is invalid
     * @throws {InternalServerError} If failed to update user last login time
     * @throws {InternalServerError} If failed to generate JWT token
     */
    async authenticateAccount(data) {
        const userInfo = await this.userService.getUser({ email: data.email, accountTypeId: data.accountTypeId });

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
