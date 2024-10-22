import { SYSTEM_AUDITS } from '../constants/index.js';

export default class AuthController {
    constructor({ authService, userService, notificationService, loggerService }) {
        this.authService = authService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.loggerService = loggerService;
    }

    async handleLoginRoute(req, res) {
        const token = this.authService.generateSession(req.user);

        await this.userService.updateUserLastLogin(req.user.id);

        if (req.body.device_token !== undefined) {
            await this.notificationService.addUserDeviceToken(req.user.id, req.body.device_token);
        }

        delete req.user.dataValues.password;
        delete req.user.dataValues.google_id;
        delete req.user.dataValues.apple_id;

        this.loggerService.logSystemAudit(req.user.id, SYSTEM_AUDITS.LOGIN);

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
