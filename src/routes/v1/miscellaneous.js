import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ miscellaneousController, selectionService }) => {
    const router = express.Router();

    router.get('/privacy-policy', miscellaneousController.handleGetPrivacyPolicyRoute.bind(miscellaneousController));

    router.get('/about-app', miscellaneousController.handleGetAboutAppRoute.bind(miscellaneousController));

    router.get('/survey', miscellaneousController.handleGetSurveyQuestionsRoute.bind(miscellaneousController));

    router.post(
        '/payment',
        validateInput([commonValidations.packageIdValidation({ selectionService })]),
        miscellaneousController.handleCreatePaymentRoute.bind(miscellaneousController),
    );

    return router;
};
