import { param } from 'express-validator';

export default ({ userService }) =>
    param('email')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .isString()
        .withMessage('Email should be string.')
        .isEmail()
        .withMessage('Invalid email.')
        .isLength({ max: 150 })
        .withMessage('Email should not exceed 150 characters.')
        .custom(async (value) => {
            if (!(await userService.isEmailExist(value))) {
                throw new Error('Email does not exist.');
            }
        });
