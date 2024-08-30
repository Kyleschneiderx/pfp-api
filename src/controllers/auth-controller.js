export default class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    async handleLoginRoute(req, res) {
        const authenticate = await this.authService.authenticateUser({
            email: req.body.email,
            password: req.body.password,
        });

        return res.json(authenticate);
    }
}
