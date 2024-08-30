export default class UserController {
    constructor({ userService }) {
        this.userService = userService;
    }

    async handleCreateUserRoute(req, res) {
        const user = await this.userService.createUserAccount({
            ...req.body,
        });
        return res.json(user);
    }

    async handleRemoveUserRoute(req, res) {
        await this.userService.removeUserAccount(req.params.user_id);

        return res.status(204).send();
    }

    async handleGetUsersRoute(req, res) {
        console.log(req.query);
        const users = await this.userService.getUsers({
            email: req.query.email,
            userId: req.query.user_id,
            name: req.query.name,
            sort: req.query.sort,
            page: req.query.page,
            page_items: req.query.page_items,
        });

        return res.json(users);
    }
}
