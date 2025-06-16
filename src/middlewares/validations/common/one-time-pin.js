import { body } from 'express-validator';

export default ({ verificationService, userService = null }) =>
    body('otp')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('OTP is required.')
        .isString()
        .withMessage('OTP should be string.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP should be 6 characters long.')
        .custom(async (value, { req }) => {
            let { email } = req.body;

            if (req.params.user_id !== undefined && email === undefined) {
                const user = await userService.getUser({ userId: req.params.user_id });

                email = user.email;
            }

            try {
                await verificationService.verifyOtp(email, value);
            } catch (error) {
                throw new Error(JSON.parse(error.message));
            }
        });
