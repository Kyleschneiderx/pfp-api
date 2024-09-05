import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/verifications/index.js';

export default ({ verificationController }) => {
    const router = express.Router();

    router.post('/otp', validateInput(validations.sendOtpValidation()), verificationController.handleSendOtpRoute.bind(verificationController));

    return router;
};
