import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/forgot-password/index.js';

export default ({ forgotPasswordController, userService, verificationService }) => {
    const router = express.Router();

    router.post(
        '/',
        validateInput(validations.sendForgotPasswordValidation({ userService })),
        forgotPasswordController.handleForgotPasswordRoute.bind(forgotPasswordController),
    );

    router.post(
        '/reset',
        validateInput(validations.resetPasswordValidation({ verificationService, userService })),
        forgotPasswordController.handleResetPasswordRoute.bind(forgotPasswordController),
    );

    return router;
};
