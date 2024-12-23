import * as dateFnsUtc from '@date-fns/utc';
import {
    REPORT_DEFAULT_PAGE,
    REPORT_DEFAULT_ITEMS,
    ACTIVE_STATUS_ID,
    INACTIVE_STATUS_ID,
    APP_SETUP_ACCOUNT_URL,
    SYSTEM_AUDITS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class UserController {
    constructor({
        userService,
        verificationService,
        authService,
        pfPlanService,
        miscellaneousService,
        notificationService,
        emailService,
        loggerService,
    }) {
        this.userService = userService;
        this.verificationService = verificationService;
        this.authService = authService;
        this.pfPlanService = pfPlanService;
        this.miscellaneousService = miscellaneousService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.loggerService = loggerService;
    }

    async handleUserSignupRoute(req, res) {
        const createUserPayload = {
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            contactNumber: req.body.contact_number,
            birthdate: req.body.birthdate,
            googleId: req.body.google_id,
            appleId: req.body.apple_id,
            photo: req.files?.photo,
            statusId: ACTIVE_STATUS_ID,
            verified_at: null,
        };

        if (req.body.google_id !== undefined || req.body.apple_id !== undefined) {
            createUserPayload.verified_at = new dateFnsUtc.UTCDate();
        }

        const user = await this.userService.createUserAccount(createUserPayload);

        if (req.body.device_token !== undefined) {
            await this.notificationService.addUserDeviceToken(user.id, req.body.device_token);
        }

        const token = this.authService.generateSession(user);

        await this.userService.updateUserLastLogin(user.id);

        this.loggerService.logSystemAudit(user.id, SYSTEM_AUDITS.REGISTER);

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

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CREATE_ACCOUNT);

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

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.UPDATE_ACCOUNT);

        return res.json(user);
    }

    async handleRemoveUserRoute(req, res) {
        await this.userService.removeUserAccount(req.params.user_id);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_ACCOUNT);

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

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CHANGE_PASSWORD);

        return res.json({ msg: 'Password successfully changed.' });
    }

    async handleUploadUserPhotoRoute(req, res) {
        const user = await this.userService.updateUserAccount({
            userId: req.params.user_id,
            photo: req.files?.photo,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.UPDATE_ACCOUNT);

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
        const progress = await this.pfPlanService.getPfPlanProgress(req.selectedPlan, { authenticatedUser: req.auth });

        return res.json(progress);
    }

    async handleGetUserPfPlanProgressStatisticsRoute(req, res) {
        return res.json(await this.pfPlanService.getPfPlanProgressStatistics(req.selectedPlan));
    }

    async handleUpdateUserSurveyRoute(req, res) {
        await this.miscellaneousService.updateUserSurveyAnswer(req.params.user_id, req.body.answers);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.SUBMIT_SURVEY);

        return res.json({ msg: 'Survey successfully submitted' });
    }

    async handleGetUserSurveyRoute(req, res) {
        const surveyAnswers = await this.miscellaneousService.getUserSurveyAnswers(req.params.user_id);

        return res.json(surveyAnswers);
    }

    async handleVerifySsoExist(req, res) {
        return res.status(204).send();
    }

    async handleRemoveUserSubscriptionRoute(req, res) {
        if (!(await this.userService.isUserPremium(req.params.user_id))) {
            throw new exceptions.Forbidden('You cannot access this content.');
        }

        await this.userService.removeUserSubscription(req.params.user_id);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_SUBSCRIPTION);

        return res.json({ msg: 'Subscription successfully removed' });
    }

    async handleSendUserInviteRoute(req, res) {
        const user = req.params.user_id;

        const token = this.authService.generateSession(user);

        await this.emailService.sendInviteEmail({
            link: `${APP_SETUP_ACCOUNT_URL}${token.access}`,
            receiver: {
                address: user.email,
                name: user.user_profile.name,
            },
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.SEND_INVITE);

        return res.json({ msg: 'Invite email successfully sent.' });
    }

    async handleSetupPasswordRoute(req, res) {
        const user = await this.userService.getUser({
            userId: req.auth.user_id,
            withProfile: true,
        });

        await this.userService.resetUserPassword(req.auth.user_id, req.body.password);

        if (req.body.device_token !== undefined) {
            await this.notificationService.addUserDeviceToken(req.auth.user_id, req.body.device_token);
        }

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.SETUP_PASSWORD);

        await this.userService.updateUserLastLogin(user.id);

        delete user.dataValues.password;

        delete user.dataValues.google_id;

        delete user.dataValues.apple_id;

        delete user.dataValues.password;

        return res.json({ msg: 'Password successfully set.', user: user });
    }

    async handleVerifyUserType(req, res) {
        const user = await this.userService.getUser({
            userId: req.auth.user_id,
        });

        return res.json({ type_id: user.type_id });
    }

    async handleRemoveUserViaAppRoute(req, res) {
        await this.userService.removeUserAccountViaApp(req.auth.user_id);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_ACCOUNT);

        return res.json({ msg: 'Successfully removed account.' });
    }

    async handleVerifySubscription(req, res) {
        const subscription = await this.miscellaneousService.getPaymentByUserId(req.auth.user_id);

        return res.json(subscription);
    }

    async handleSendOtpRoute(req, res) {
        const user = await this.userService.getUser({
            userId: req.auth.user_id,
        });

        const verificationCode = await this.verificationService.sendOtp(user.email);

        return res.status(200).json({
            msg: 'Successfully sent OTP to your email. Check your OTP to proceed with your action.',
            ...(process.env.APP_ENV !== 'production' && { code: verificationCode.code }),
        });
    }

    async handleVerifyOtp(req, res) {
        await this.userService.updateUserVerifiedTime(req.auth.user_id);

        const user = await this.userService.getUserDetails(req.auth.user_id);

        return res.json(user);
    }
}
