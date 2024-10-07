import { param } from 'express-validator';
import { USER_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ userService }) =>
    param('user_id')
        .exists({ values: 'falsy' })
        .withMessage('User id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            if (!(await userService.isUserExistByUserId(value))) {
                throw new Error('User does not exist.');
            }

            if (req.auth.account_type_id === USER_ACCOUNT_TYPE_ID && req.auth.user_id !== value) {
                throw new Error('Invalid user.');
            }
        });
