import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, file, verificationService }) => [
    ...commonValidation.createUserValidation({ userService: userService, file: file }),
    body('password').trim().exists({ values: 'falsy' }).withMessage('Password is required.').isString().isStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
        minLowercase: 1,
    }),
    body('otp')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('OTP is required.')
        .isString()
        .isLength({ min: 6, max: 6 })
        .custom(async (value, { req }) => {
            try {
                await verificationService.verifyOtp(req.body.email, value);
            } catch (error) {
                throw new Error(JSON.parse(error.message));
            }
        }),
];
