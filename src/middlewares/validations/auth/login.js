import { body } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ userService, password, isAdmin, authService }) => {
    const verifySsoToken = async (token, ssoIdentifier) => {
        let decodedToken;
        try {
            decodedToken = await authService.verifySocialMediaIdToken(token);
        } catch (error) {
            throw new Error('Invalid token.');
        }

        if (decodedToken?.firebase?.identities?.[ssoIdentifier] === undefined) {
            throw new Error('Invalid token.');
        }

        return decodedToken.firebase.identities[ssoIdentifier][0];
    };

    return [
        body('email')
            .trim()
            .if(body('google_token').not().exists({ values: 'falsy' }))
            .if(body('apple_token').not().exists({ values: 'falsy' }))
            .exists({ values: 'falsy' })
            .withMessage('Email is required.')
            .isString()
            .isEmail()
            .isLength({ max: 150 })
            .customSanitizer(async (value, { req }) => {
                req.user = await userService.getUser({
                    email: value,
                    accountTypeId: isAdmin ? constants.ADMIN_ACCOUNT_TYPE_ID : constants.USER_ACCOUNT_TYPE_ID,
                    withProfile: true,
                });

                return value;
            })
            .custom(async (value, { req }) => {
                if (!req.user) {
                    throw new Error('Incorrect email or password.');
                }

                return true;
            }),
        body('password')
            .trim()
            .if(body('google_token').not().exists({ values: 'falsy' }))
            .if(body('apple_token').not().exists({ values: 'falsy' }))
            .exists({ values: 'falsy' })
            .withMessage('Password is required.')
            .isString()
            .custom(async (value, { req }) => {
                if (!password.verify(value, req.user.password)) {
                    throw new Error('Incorrect email or password.');
                }

                return true;
            }),
        body('google_token')
            .trim()
            .if(body('google_token').exists({ values: 'falsy' }))
            .exists({ values: 'falsy' })
            .withMessage('Google token is required.')
            .isString()
            .custom(async (value, { req }) => {
                let googleId;

                try {
                    googleId = await verifySsoToken(value, 'google.com');
                } catch (error) {
                    throw new Error('Invalid google token.');
                }

                req.user = await userService.getUser({
                    googleId: googleId,
                    accountTypeId: constants.USER_ACCOUNT_TYPE_ID,
                    withProfile: true,
                });
                if (!req.user) {
                    throw new Error('Account does not exist.');
                }

                return true;
            }),
        body('apple_token')
            .trim()
            .if(body('apple_token').exists({ values: 'falsy' }))
            .exists({ values: 'falsy' })
            .withMessage('Apple token is required.')
            .isString()
            .custom(async (value, { req }) => {
                let appleId;

                try {
                    appleId = await verifySsoToken(value, 'apple.com');
                } catch (error) {
                    throw new Error('Invalid apple token.');
                }

                req.user = await userService.getUser({
                    appleId: appleId,
                    accountTypeId: constants.USER_ACCOUNT_TYPE_ID,
                    withProfile: true,
                });
                if (!req.user) {
                    throw new Error('Account does not exist.');
                }

                return true;
            }),
    ];
};
