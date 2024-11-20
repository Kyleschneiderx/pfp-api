import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ miscellaneousController, selectionService, inAppPurchase }) => {
    const router = express.Router();

    router.get('/privacy-policy', miscellaneousController.handleGetPrivacyPolicyRoute.bind(miscellaneousController));

    router.get('/about-app', miscellaneousController.handleGetAboutAppRoute.bind(miscellaneousController));

    router.get('/survey', miscellaneousController.handleGetSurveyQuestionsRoute.bind(miscellaneousController));

    router.post(
        '/payment',
        validateInput([commonValidations.inAppPurchaseReceiptValidation({ inAppPurchase })]),
        miscellaneousController.handleCreatePaymentRoute.bind(miscellaneousController),
    );

    router.post('/contact-support', miscellaneousController.handleSendContactSupportRoute.bind(miscellaneousController));

    return router;
};
