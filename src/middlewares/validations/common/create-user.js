import { body } from 'express-validator';
import photoValidation from './photo.js';
import emailValidation from './email.js';

export default ({ userService, file }) => [
    emailValidation()
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .custom(async (value) => {
            if (await userService.isEmailExist(value)) {
                throw new Error('Email already exist.');
            }
        }),
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('birthdate')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Birthdate is required.')
        .isDate()
        .withMessage('Birthdate should be a valid date.')
        .isISO8601()
        .withMessage('Invalid date format.')
        .isBefore(new Date().toUTCString())
        .withMessage('Birthdate should be before today.'),
    body('contact_number')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Contact number is required.')
        .isString()
        .withMessage('Contact number should be string.')
        .isLength({ max: 20 })
        .withMessage('Contact number should not exceed 20 characters.')
        .isNumeric(),
    ...photoValidation({ field: 'photo', file: file }),
];
