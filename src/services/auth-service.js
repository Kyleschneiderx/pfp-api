export default class AuthService {
    constructor({ logger, database, jwt, userService }) {
        this.database = database;
        this.logger = logger;
        this.jwt = jwt;
        this.userService = userService;
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

        const token = this.jwt.generate(
            process.env.JWT_SECRET,
            { user: { user_id: user.id, account_type_id: user.account_type_id } },
            { algorithm: process.env.JWT_ALGORITHM },
        );

        await this.userService.updateUserLastLogin(user.id);

        return {
            user: user,
            token: {
                access: token.token,
                expires: token.expires,
            },
        };
    }
}
