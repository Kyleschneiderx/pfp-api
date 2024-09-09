import emailValidation from '../common/email.js';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ userService }) => [
    emailValidation()
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .custom(async (value, { req }) => {
            req.user = await userService.getUser({
                email: value,
                accountTypeId: ADMIN_ACCOUNT_TYPE_ID,
                withProfile: true,
            });

            if (!req.user) {
                throw new Error('Account does not exist.');
            }

            return true;
        }),
];
