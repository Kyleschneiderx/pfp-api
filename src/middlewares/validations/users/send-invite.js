import { USER_ACCOUNT_TYPE_ID } from '../../../constants/index.js';
import * as commonValidation from '../common/index.js';

export default ({ userService }) => {
    const [rules] = commonValidation.userIdValidation({ userService });

    rules
        .customSanitizer(async (value, { req }) => {
            req.user = await userService.getUser({ userId: value, accountTypeId: USER_ACCOUNT_TYPE_ID, withProfile: true });

            return value;
        })
        .custom((value, { req }) => {
            const { user } = req;

            if (user === undefined) {
                throw new Error('Invalid user');
            }

            if (user.password) {
                throw new Error('User already set up their account');
            }

            return true;
        })
        .customSanitizer((value, { req }) => {
            const { user } = req;

            delete req.user;

            return user;
        });

    return rules;
};
