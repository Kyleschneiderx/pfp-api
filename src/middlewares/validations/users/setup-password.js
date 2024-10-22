import { check } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { USER_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ userService, password }) => [
    check('user').custom(async (value, { req }) => {
        const user = await userService.getUser({ userId: req.auth.user_id, accountTypeId: USER_ACCOUNT_TYPE_ID });

        if (user.password) {
            throw new Error('User already set up their account');
        }

        return true;
    }),
    ...commonValidation.passwordValidation({ password }),
];
