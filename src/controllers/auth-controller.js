export default class AuthController {
    constructor({ authService, userService }) {
        this.authService = authService;
        this.userService = userService;
    }

    async handleLoginRoute(req, res) {
        const authenticate = this.authService.generateSession(req.user);

        await this.userService.updateUserLastLogin(authenticate.user.id);

        return res.json(authenticate);
    }
}
