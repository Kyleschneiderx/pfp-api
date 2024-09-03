import { body, oneOf } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ userService, password, isAdmin }) => [
    oneOf(
        [
            [
                body('email')
                    .trim()
                    .exists({ values: 'falsy' })
                    .withMessage('Email is required.')
                    .isString()
                    .isEmail()
                    .custom(async (value) => {
                        if (
                            !(await userService.getUser({
                                email: value,
                                accountTypeId: isAdmin ? constants.ADMIN_ACCOUNT_TYPE_ID : constants.USER_ACCOUNT_TYPE_ID,
                            }))
                        ) {
                            throw new Error('Account does not exist.');
                        }

                        return true;
                    }),
                body('password')
                    .trim()
                    .exists({ values: 'falsy' })
                    .withMessage('Password is required.')
                    .isString()
                    .custom(async (value, { req }) => {
                        req.user = await userService.getUser({
                            email: req.email,
                            accountTypeId: isAdmin ? constants.ADMIN_ACCOUNT_TYPE_ID : constants.USER_ACCOUNT_TYPE_ID,
                        });
                        if (!password.verify(value, req.user.password)) {
                            throw new Error('Incorrect password.');
                        }

                        return true;
                    }),
            ],
            body('google_id')
                .trim()
                .exists({ values: 'falsy' })
                .withMessage('Google id is required.')
                .isString()
                .custom(async (value, { req }) => {
                    req.user = await userService.getUser({
                        googleId: value,
                        accountTypeId: constants.USER_ACCOUNT_TYPE_ID,
                    });
                    if (!req.user) {
                        throw new Error('Account does not exist.');
                    }

                    return true;
                }),
            body('apple_id')
                .trim()
                .exists({ values: 'falsy' })
                .withMessage('Apple id is required.')
                .isString()
                .custom(async (value, { req }) => {
                    req.user = await userService.getUser({
                        appleId: value,
                        accountTypeId: constants.USER_ACCOUNT_TYPE_ID,
                    });
                    if (!req.user) {
                        throw new Error('Account does not exist.');
                    }

                    return true;
                }),
        ],
        { message: 'At least one authentication method should be provided.', errorType: 'least_errored' },
    ),
];
