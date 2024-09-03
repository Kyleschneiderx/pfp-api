export default class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    async handleLoginRoute(req, res) {
        const authenticate = await this.authService.generateSession(req.user);

        return res.json(authenticate);
    }
}
