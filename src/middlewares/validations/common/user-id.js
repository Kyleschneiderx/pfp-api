import { param } from 'express-validator';

export default ({ userService }) =>
    param('user_id')
        .exists({ values: 'falsy' })
        .withMessage('User id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await userService.isUserExistByUserId(value))) {
                throw new Error('User does not exist.');
            }
        });
