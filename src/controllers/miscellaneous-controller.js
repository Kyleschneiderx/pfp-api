import { SYSTEM_AUDITS } from '../constants/index.js';

export default class MiscellaneousController {
    constructor({ miscellaneousService, loggerService }) {
        this.miscellaneousService = miscellaneousService;
        this.loggerService = loggerService;
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
            package: req.subscriptionPackage,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CREATE_SUBSCRIPTION_PAYMENT);

        return res.status(201).json(payment);
    }
}
