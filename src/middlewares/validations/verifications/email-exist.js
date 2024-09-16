import { param } from 'express-validator';

export default ({ userService }) =>
    param('email')
        .trim()
        .exists({ values: 'falsy' })
        .isString()
        .isEmail()
        .isLength({ max: 150 })
        .withMessage('Email is required.')
        .custom(async (value) => {
            if (!(await userService.isEmailExist(value))) {
                throw new Error('Email does not exist.');
            }
        });
