import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';
import * as validations from '../../middlewares/validations/verifications/index.js';

export default ({ verificationController, verificationService, authService, userService, userController }) => {
    const router = express.Router();

    router.post(
        '/otp/verify',
        validateInput([commonValidations.oneTimePinValidation({ verificationService })]),
        verificationController.handleVerifyOtp.bind(verificationController),
    );

    router.post('/otp', validateInput([commonValidations.emailValidation()]), verificationController.handleSendOtpRoute.bind(verificationController));

    router.post(
        '/token',
        validateInput([commonValidations.tokenValidation({ authService })]),
        verificationController.handleVerifyTokenRoute.bind(verificationController),
    );

    router.get(
        '/exist/email/:email',
        validateInput([validations.emailExistValidation({ userService })]),
        userController.handleVerifyEmailExist.bind(verificationController),
    );

    router.get(
        '/exist/sso/:token',
        validateInput([validations.ssoExistValidation({ userService, authService })]),
        userController.handleVerifySsoExist.bind(verificationController),
    );

    return router;
};
