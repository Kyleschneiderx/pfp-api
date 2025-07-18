import { CONTACT_SUPPORT_EMAIL, CONTACT_SUPPORT_NAME, SYSTEM_AUDITS } from '../constants/index.js';

export default class MiscellaneousController {
    constructor({ miscellaneousService, loggerService, emailService, userService }) {
        this.miscellaneousService = miscellaneousService;
        this.loggerService = loggerService;
        this.emailService = emailService;
        this.userService = userService;
    }

    async handleGetPrivacyPolicyRoute(req, res) {
        return res.json(await this.miscellaneousService.getPrivacyPolicy());
    }

    async handleGetAboutAppRoute(req, res) {
        return res.json(await this.miscellaneousService.getAboutApp());
    }

    async handleGetSurveyQuestionsRoute(req, res) {
        return res.json(await this.miscellaneousService.getSurveyQuestions());
    }

    async handleCreatePaymentRoute(req, res) {
        const payment = await this.miscellaneousService.createPayment({
            userId: req.auth.user_id,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CREATE_SUBSCRIPTION_PAYMENT);

        return res.status(201).json(payment);
    }

    async handleSendContactSupportRoute(req, res) {
        const user = await this.userService.getUser({ userId: req.auth.user_id, withProfile: true });

        await this.emailService.sendContactSupportEmail({
            receiver: {
                name: CONTACT_SUPPORT_NAME,
                address: CONTACT_SUPPORT_EMAIL,
            },
            name: user.user_profile.name,
            email: req.body.email ?? user.email,
            message: req.body.message ?? '',
        });

        return res.json({
            msg: 'Successfully post message to support.',
        });
    }

    async handlePageTrackingRoute(req, res) {
        await this.miscellaneousService.createPageVisit({
            deviceId: req.body.device_id,
            page: req.body.page,
        });

        return res.json({
            msg: 'Successfully recorded page visit.',
        });
    }

    async handlePageTrackingStatsRoute(req, res) {
        const stats = await this.miscellaneousService.getPageVisitStats({
            dateFrom: req.query.date_from,
            dateTo: req.query.date_to,
        });

        return res.json(stats);
    }

    async handleSendFeedbackRoute(req, res) {
        const user = await this.userService.getUser({ userId: req.auth.user_id, withProfile: true });

        await this.emailService.sendFeedbackEmail({
            receiver: {
                name: CONTACT_SUPPORT_NAME,
                address: CONTACT_SUPPORT_EMAIL,
            },
            email: user.email,
            name: user.user_profile.name,
            rating: req.body.rating ?? 0,
            ratingReason: req.body.rating_reason ?? '',
            usefulFeature: req.body.useful_feature ?? '',
            enhancement: req.body.enhancement ?? '',
        });

        return res.json({
            msg: 'Successfully send feedback.',
        });
    }

    async handleRevenuecatWebhookRoute(req, res) {
        await this.miscellaneousService.processRevenuecatWebhook(req.body);

        return res.json({ msg: 'Successfully processed webhook.' });
    }
}
