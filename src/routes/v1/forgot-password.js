import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/forgot-password/index.js';

export default ({ forgotPasswordController, userService, verificationService, authService, password }) => {
    const router = express.Router();

    router.post(
        '/admin',
        validateInput(validations.sendForgotPasswordValidation({ userService })),
        forgotPasswordController.handleForgotPasswordWebRoute.bind(forgotPasswordController),
    );

    router.post(
        '/app',
        validateInput(validations.sendOtpForgotPasswordValidation({ userService })),
        forgotPasswordController.handleForgotPasswordAppRoute.bind(forgotPasswordController),
    );

    router.post(
        '/reset',
        validateInput(validations.resetPasswordValidation({ verificationService, userService, authService, password })),
        forgotPasswordController.handleResetPasswordRoute.bind(forgotPasswordController),
    );

    return router;
};
