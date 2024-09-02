import { USER_ACCOUNT_TYPE_ID, ADMIN_ACCOUNT_TYPE_ID } from '../constants/index.js';

export default class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    async handleLoginAdminRoute(req, res) {
        const authenticate = await this.authService.authenticateAccount({
            accountTypeId: ADMIN_ACCOUNT_TYPE_ID,
            email: req.body.email,
            password: req.body.password,
        });

        return res.json(authenticate);
    }

    async handleLoginUserRoute(req, res) {
        const authenticate = await this.authService.authenticateAccount({
            accountTypeId: USER_ACCOUNT_TYPE_ID,
            email: req.body.email,
            password: req.body.password,
            googleId: req.body.google_id,
            appleId: req.body.apple_id,
        });

        return res.json(authenticate);
    }
}
