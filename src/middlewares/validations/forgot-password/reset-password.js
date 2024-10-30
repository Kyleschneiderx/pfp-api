import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ verificationService, userService, authService, password }) => [
    body('email')
        .trim()
        .if(body('token').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .isString()
        .withMessage('Email should be string.')
        .isEmail()
        .withMessage('Invalid email.')
        .isLength({ max: 150 })
        .withMessage('Email should not exceed 150 characters.'),
    body('otp')
        .trim()
        .if(body('token').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('OTP is required.')
        .isString()
        .withMessage('OTP should be string.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP should be 6 characters long.')
        .custom(async (value, { req }) => {
            let resetRequest;
            try {
                resetRequest = await authService.verifyResetPasswordRequestReference(value, 'otp');
            } catch (error) {
                throw new Error(JSON.parse(error?.message));
            }

            if (!(await verificationService.isOtpExistByEmail(req.body.email, value))) {
                throw new Error('Invalid OTP.');
            }

            req.user = await userService.getUser({ email: req.body.email });
            req.resetRequest = resetRequest;
        }),
    body('token')
        .trim()
        .if(body('token').exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Token is required.')
        .isString()
        .withMessage('Token should be string.')
        .custom(async (value, { req }) => {
            let resetRequest;
            try {
                resetRequest = await authService.verifyResetPasswordRequestReference(value, 'token');
            } catch (error) {
                throw new Error(JSON.parse(error?.message));
            }

            req.user = await userService.getUser({ userId: resetRequest.user_id });
            req.resetRequest = resetRequest;
        }),
    ...commonValidation.passwordValidation({ isReset: true, password }),
];
