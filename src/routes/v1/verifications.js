import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verificationController, verificationService }) => {
    const router = express.Router();

    router.post(
        '/otp/verify',
        validateInput([commonValidations.oneTimePinValidation({ verificationService })]),
        verificationController.handleVerifyOtp.bind(verificationController),
    );

    router.post('/otp', validateInput([commonValidations.emailValidation()]), verificationController.handleSendOtpRoute.bind(verificationController));

    return router;
};
