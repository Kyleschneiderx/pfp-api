import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ notificationController }) => {
    const router = express.Router();

    router.get(
        '/',
        validateInput(commonValidations.paginationValidation()),
        notificationController.handleGetNotificationsRoute.bind(notificationController),
    );

    return router;
};
