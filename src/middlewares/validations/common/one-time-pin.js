import { body } from 'express-validator';

export default ({ verificationService }) =>
    body('otp')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('OTP is required.')
        .isString()
        .withMessage('OTP should be string.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP should be 6 characters long.')
        .custom(async (value, { req }) => {
            try {
                await verificationService.verifyOtp(req.body.email, value);
            } catch (error) {
                throw new Error(JSON.parse(error.message));
            }
        });
