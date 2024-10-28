import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/notifications/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ notificationController, verifyUser }) => {
    const router = express.Router();

    router.use(verifyUser);

    router.get(
        '/',
        validateInput(commonValidations.paginationValidation()),
        notificationController.handleGetNotificationsRoute.bind(notificationController),
    );

    router.delete('/', notificationController.handleRemoveNotificationRoute.bind(notificationController));

    router.put(
        '/settings',
        validateInput(validations.updateNotificationSettingsValidation()),
        notificationController.handleUpdateNotificationSettingsRoute.bind(notificationController),
    );

    router.get('/settings', notificationController.handleGetNotificationSettingsRoute.bind(notificationController));

    return router;
};
