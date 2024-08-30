import { param } from 'express-validator';

export default ({ userService }) => [
    param('user_id')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('User id is required.')
        .isInt()
        .custom(async (value) => {
            if (!(await userService.isUserExistByUserId(value))) {
                throw new Error('Account does not exist.');
            }
        }),
];
