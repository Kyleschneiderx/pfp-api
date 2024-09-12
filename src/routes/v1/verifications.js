import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verificationController, verificationService, authService }) => {
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

    return router;
};
