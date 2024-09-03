import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService }) => [
    ...commonValidation.createUserValidation({ userService }),
    body('password').trim().exists({ values: 'falsy' }).withMessage('Password is required.').isString().isStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
        minLowercase: 1,
    }),
];
