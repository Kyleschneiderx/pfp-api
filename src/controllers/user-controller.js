import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS, ACTIVE_STATUS_ID, INACTIVE_STATUS_ID } from '../constants/index.js';

export default class UserController {
    constructor({ userService, verificationService, authService, pfPlanService }) {
        this.userService = userService;
        this.verificationService = verificationService;
        this.authService = authService;
        this.pfPlanService = pfPlanService;
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
            statusId: ACTIVE_STATUS_ID,
            verified_at: new Date(),
        });

        const token = this.authService.generateSession(user);

        await this.userService.updateUserLastLogin(user.id);

        return res.status(201).json({
            user: user,
            token: token,
        });
    }

    async handleCreateUserRoute(req, res) {
        const user = await this.userService.createUserAccount({
            email: req.body.email,
            name: req.body.name,
            contactNumber: req.body.contact_number,
            birthdate: req.body.birthdate,
            description: req.body.description,
            typeId: req.body.type_id,
            statusId: INACTIVE_STATUS_ID,
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

        return res.json({ msg: 'Successfully removed patient.' });
    }

    async handleGetUsersRoute(req, res) {
        const users = await this.userService.getUsers({
            email: req.query.email,
            userId: req.query.id,
            name: req.query.name,
            statusId: req.query.status_id,
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

        return res.json({ msg: 'Successfully removed patient photo.' });
    }

    async handleVerifyEmailExist(req, res) {
        return res.status(204).send();
    }

    async handleChangePasswordRoute(req, res) {
        await this.userService.resetUserPassword(req.params.user_id, req.body.password);
        return res.json({ msg: 'Password successfully changed.' });
    }

    async handleUploadUserPhotoRoute(req, res) {
        const user = await this.userService.updateUserAccount({
            userId: req.params.user_id,
            photo: req.files?.photo,
        });
        return res.json({ photo: user.user_profile.photo });
    }

    async handleGetUserSummaryRoute(req, res) {
        return res.json(await this.userService.getUserSummary());
    }

    async handleGetUserPfPlanProgressRoute(req, res) {
        const selectedPlan = await this.pfPlanService.getSelectedPfPlanByUserId(req.auth.user_id);

        const progress = await this.pfPlanService.getPfPlanProgress(selectedPlan?.pf_plan_id, selectedPlan?.user_id);

        return res.json(progress);
    }
}
