import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS } from '../constants/index.js';

export default class UserController {
    constructor({ userService, verificationService }) {
        this.userService = userService;
        this.verificationService = verificationService;
    }

    async handleUserSignupRoute(req, res) {
        const user = await this.userService.createUserAccount({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            contactNumber: req.body.contact_number,
            birthdate: req.body.birthdate,
            googleId: req.body.google_id,
            appleId: req.body.apple_id,
            photo: req.files?.photo,
            verified_at: new Date(),
        });

        return res.status(201).json(user);
    }

    async handleCreateUserRoute(req, res) {
        const user = await this.userService.createUserAccount({
            email: req.body.email,
            name: req.body.name,
            contactNumber: req.body.contact_number,
            birthdate: req.body.birthdate,
            description: req.body.description,
            typeId: req.body.type_id,
            photo: req.files?.photo,
        });

        return res.status(201).json(user);
    }

    async handleUpdateUserRoute(req, res) {
        const user = await this.userService.updateUserAccount({
            userId: req.params.user_id,
            email: req.body.email,
            name: req.body.name,
            contactNumber: req.body.contact_number,
            birthdate: req.body.birthdate,
            description: req.body.description,
            typeId: req.body.type_id,
            photo: req.files?.photo,
        });
        return res.json(user);
    }

    async handleRemoveUserRoute(req, res) {
        await this.userService.removeUserAccount(req.params.user_id);

        return res.status(204).send();
    }

    async handleGetUsersRoute(req, res) {
        const users = await this.userService.getUsers({
            email: req.query.email,
            userId: req.query.id,
            name: req.query.name,
            sort: req.query.sort,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });

        return res.json(users);
    }

    async handleGetUserRoute(req, res) {
        const user = await this.userService.getUsers({
            userId: req.params.user_id,
            page: REPORT_DEFAULT_PAGE,
            pageItems: REPORT_DEFAULT_ITEMS,
        });

        return res.json(user.data[0]);
    }

    async handleRemoveUserPhotoRoute(req, res) {
        await this.userService.removeUserPhoto(req.params.user_id);

        return res.status(204).send();
    }
}
