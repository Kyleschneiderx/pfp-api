import { body } from 'express-validator';
import photoValidation from './photo.js';

export default ({ userService, file }) => [
    body('email')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .isString()
        .isEmail()
        .isLength({ max: 150 })
        .custom(async (value) => {
            if (await userService.isEmailExist(value)) {
                throw new Error('Email already exist.');
            }
        }),
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 300 }),
    body('birthdate').trim().exists({ values: 'falsy' }).withMessage('Birthdate is required.').isDate().isISO8601(),
    body('contact_number').trim().exists({ values: 'falsy' }).withMessage('Contact number is required.').isString().isLength({ max: 20 }).isNumeric(),
    ...photoValidation({ field: 'photo', file: file }),
];
