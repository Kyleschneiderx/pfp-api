export default class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    async handleLoginAdminRoute(req, res) {
        const authenticate = await this.authService.authenticateAdmin({
            email: req.body.email,
            password: req.body.password,
        });

        return res.json(authenticate);
    }

    async handleLoginUserRoute(req, res) {
        const authenticate = await this.authService.authenticateUser({
            email: req.body.email,
            password: req.body.password,
        });

        return res.json(authenticate);
    }
}
