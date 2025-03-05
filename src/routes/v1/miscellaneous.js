import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/miscellaneous/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ miscellaneousController, revenuecat, verifyAuth }) => {
    const router = express.Router();

    router.post('/page-tracking', miscellaneousController.handlePageTrackingRoute.bind(miscellaneousController));

    router.use(verifyAuth);

    router.get('/privacy-policy', miscellaneousController.handleGetPrivacyPolicyRoute.bind(miscellaneousController));

    router.get('/about-app', miscellaneousController.handleGetAboutAppRoute.bind(miscellaneousController));

    router.get('/survey', miscellaneousController.handleGetSurveyQuestionsRoute.bind(miscellaneousController));

    router.post(
        '/payment',
        validateInput([commonValidations.purchaseSubscription({ revenuecat })]),
        miscellaneousController.handleCreatePaymentRoute.bind(miscellaneousController),
    );

    router.post('/contact-support', miscellaneousController.handleSendContactSupportRoute.bind(miscellaneousController));

    router.get('/page-tracking/stats', miscellaneousController.handlePageTrackingStatsRoute.bind(miscellaneousController));

    router.post(
        '/feedback',
        validateInput(validations.sendFeedback()),
        miscellaneousController.handleSendFeedbackRoute.bind(miscellaneousController),
    );

    return router;
};
