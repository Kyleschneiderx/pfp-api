import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { USER_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ userService, password }) => {
    const rules = [commonValidation.userAccessUserIdValidation({ userService })];

    rules.push(
        body('old_password')
            .trim()
            .customSanitizer(async (value, { req }) => {
                req.user = await userService.getUser({ userId: req.params.user_id });
                return value;
            })
            .custom((value, { req }) => {
                if (req.user.google_id || req.user.apple_id) {
                    const platform = req.user.google_id ? 'Google' : 'Apple';
                    throw new Error(`This account was used to login using ${platform}.`);
                }

                return true;
            })
            .if(body('old_password').custom((value, { req }) => req.auth.account_type_id === USER_ACCOUNT_TYPE_ID))
            .exists({ value: 'falsy' })
            .withMessage('Old password is required.')
            .isString()
            .withMessage('Old password should be string.')
            .custom((value, { req }) => {
                if (!password.verify(value, req.user.password)) {
                    throw new Error('Incorrect old password.');
                }
                return true;
            }),
    );

    rules.push(...commonValidation.passwordValidation({ isReset: true, password }));

    return rules;
};
