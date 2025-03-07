import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ miscellaneousController, miscellaneousService, inAppPurchase, verifyAuth }) => {
    const router = express.Router();

    router.post('/page-tracking', miscellaneousController.handlePageTrackingRoute.bind(miscellaneousController));

    router.use(verifyAuth);

    router.get('/privacy-policy', miscellaneousController.handleGetPrivacyPolicyRoute.bind(miscellaneousController));

    router.get('/about-app', miscellaneousController.handleGetAboutAppRoute.bind(miscellaneousController));

    router.get('/survey', miscellaneousController.handleGetSurveyQuestionsRoute.bind(miscellaneousController));

    router.post(
        '/payment',
        validateInput([commonValidations.inAppPurchaseReceiptValidation({ inAppPurchase, miscellaneousService })]),
        miscellaneousController.handleCreatePaymentRoute.bind(miscellaneousController),
    );

    router.post('/contact-support', miscellaneousController.handleSendContactSupportRoute.bind(miscellaneousController));

    router.get('/page-tracking/stats', miscellaneousController.handlePageTrackingStatsRoute.bind(miscellaneousController));

    return router;
};
