import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ verificationService, userService }) => [
    body('email')
        .trim()
        .if(body('token').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .isString()
        .isEmail()
        .isLength({ max: 150 }),
    body('otp')
        .trim()
        .if(body('token').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('OTP is required.')
        .isString()
        .isLength({ min: 6, max: 6 })
        .custom(async (value, { req }) => {
            if (!(await verificationService.isOtpExistByEmail(req.body.email, value))) {
                throw new Error('Invalid OTP.');
            }

            req.user = await userService.getUser({ email: req.body.email });
        }),
    ...commonValidation.passwordValidation(),
];
