import { body } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ userService, password, isAdmin }) => [
    body('email')
        .trim()
        .if(body('google_id').not().exists({ values: 'falsy' }))
        .if(body('apple_id').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .isString()
        .isEmail()
        .customSanitizer(async (value, { req }) => {
            req.user = await userService.getUser({
                email: value,
                accountTypeId: isAdmin ? constants.ADMIN_ACCOUNT_TYPE_ID : constants.USER_ACCOUNT_TYPE_ID,
            });

            return value;
        })
        .custom(async (value, { req }) => {
            if (!req.user) {
                throw new Error('Account does not exist.');
            }

            return true;
        }),
    body('password')
        .trim()
        .if(body('google_id').not().exists({ values: 'falsy' }))
        .if(body('apple_id').not().exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Password is required.')
        .isString()
        .custom(async (value, { req }) => {
            req.user = await userService.getUser({
                email: req.body.email,
                accountTypeId: isAdmin ? constants.ADMIN_ACCOUNT_TYPE_ID : constants.USER_ACCOUNT_TYPE_ID,
            });
            if (!password.verify(value, req.user.password)) {
                throw new Error('Incorrect password.');
            }

            return true;
        }),
    body('google_id')
        .trim()
        .if(body('google_id').exists({ values: 'falsy' }))
        .exists({ values: 'falsy' })
        .withMessage('Google id is required.')
        .isString()
        .custom(async (value, { req }) => {
            console.log(value);
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
        .if(body('apple_id').exists({ values: 'falsy' }))
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
];
