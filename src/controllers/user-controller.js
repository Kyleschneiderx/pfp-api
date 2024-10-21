import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS, ACTIVE_STATUS_ID, INACTIVE_STATUS_ID } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class UserController {
    constructor({ userService, verificationService, authService, pfPlanService, miscellaneousService, notificationService }) {
        this.userService = userService;
        this.verificationService = verificationService;
        this.authService = authService;
        this.pfPlanService = pfPlanService;
        this.miscellaneousService = miscellaneousService;
        this.notificationService = notificationService;
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

        if (req.body.device_token !== undefined) {
            await this.notificationService.addUserDeviceToken(user.id, req.body.device_token);
        }

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
        const user = await this.userService.getUserDetails(req.params.user_id);

        return res.json(user);
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
        return res.json(
            await this.userService.getUserSummary({
                period: req.query.period,
                dateFrom: req.query.date_from,
                dateTo: req.query.date_to,
            }),
        );
    }

    async handleGetUserPfPlanProgressRoute(req, res) {
        const progress = await this.pfPlanService.getPfPlanProgress(req.selectedPlan);

        return res.json(progress);
    }

    async handleUpdateUserSurveyRoute(req, res) {
        if (!(await this.userService.isUserPremium(req.params.user_id))) {
            throw new exceptions.Forbidden('You cannot access this content.');
        }

        await this.miscellaneousService.updateUserSurveyAnswer(req.params.user_id, req.body.answers);

        return res.json({ msg: 'Survey successfully submitted' });
    }

    async handleVerifySsoExist(req, res) {
        return res.status(204).send();
    }

    async handleRemoveUserSubscriptionRoute(req, res) {
        if (!(await this.userService.isUserPremium(req.params.user_id))) {
            throw new exceptions.Forbidden('You cannot access this content.');
        }

        await this.userService.removeUserSubscription(req.params.user_id);

        return res.json({ msg: 'Subscription successfully removed' });
    }
}
