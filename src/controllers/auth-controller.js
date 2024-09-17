export default class AuthController {
    constructor({ authService, userService }) {
        this.authService = authService;
        this.userService = userService;
    }

    async handleLoginRoute(req, res) {
        const token = this.authService.generateSession(req.user);

        await this.userService.updateUserLastLogin(req.user.id);

        delete req.user.dataValues.password;
        delete req.user.dataValues.google_id;
        delete req.user.dataValues.apple_id;

        return res.json({
            user: req.user,
            token: token,
        });
    }

    async handleRefreshTokenRoute(req, res) {
        const user = this.userService.getUser({ userId: req.user });

        const token = this.authService.generateSession(user);

        return res.json({
            token: token,
        });
    }
}
