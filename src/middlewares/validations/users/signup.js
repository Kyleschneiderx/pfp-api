import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, file, authService }) => [
    ...commonValidation.createUserValidation({ userService: userService, file: file }),
    ...commonValidation.passwordValidation({ isSignup: true }),
    body('google_token')
        .trim()
        .if(body('google_token').exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Google token is required.')
        .isString()
        .withMessage('Google token should be string.')
        .custom(async (value, { req }) => {
            let payload;
            try {
                payload = await authService.verifySocialMediaIdToken(value);
                [req.body.google_id] = payload.firebase.identities['google.com'];
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
        .withMessage('Apple token should be string.')
        .custom(async (value, { req }) => {
            let payload;
            try {
                payload = await authService.verifySocialMediaIdToken(value);

                [req.body.apple_id] = payload.firebase.identities['apple.com'];
            } catch (error) {
                throw new Error('Unable to verify token.', { cause: error });
            }
        }),
];
