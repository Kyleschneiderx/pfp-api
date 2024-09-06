import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, file, verificationService, authService }) => [
    ...commonValidation.createUserValidation({ userService: userService, file: file }),
    body('password')
        .trim()
        .if(body('google_token').not().exists({ values: 'falsy' }))
        .if(body('apple_token').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Password is required.')
        .isString()
        .isStrongPassword({
            minLength: 8,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1,
            minLowercase: 1,
        }),
    body('google_token')
        .trim()
        .if(body('google_token').exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Google token is required.')
        .isString()
        .custom(async (value, { req }) => {
            let payload;
            try {
                payload = await authService.verifySocialMediaIdToken(value);
                [req.body.google_id] = payload.firebase.identities.google.com;
            } catch (error) {
                throw new Error('Unable to verify token.', { cause: error });
            }
        }),
    body('apple_token')
        .trim()
        .if(body('apple_token').exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Apple token is required.')
        .isString()
        .custom(async (value, { req }) => {
            let payload;
            try {
                payload = await authService.verifySocialMediaIdToken(value);
                [req.body.apple_id] = payload.firebase.identities.apple.com;
            } catch (error) {
                throw new Error('Unable to verify token.', { cause: error });
            }
        }),
];
