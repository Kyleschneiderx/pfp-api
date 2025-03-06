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
            reference: req.body.reference,
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
            email: user.email,
            message: req.body.message ?? '',
        });

        return res.json({
            msg: 'Successfully post message to support.',
        });
    }

    async handleRevenuecatWebhookRoute(req, res) {
        await this.miscellaneousService.processRevenuecatWebhook(req.body);

        return res.json({ msg: 'Successfully processed webhook.' });
    }
}
