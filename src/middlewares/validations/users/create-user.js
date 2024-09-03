import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, file, selectionService }) => [
    body('email')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Email is required.')
        .isString()
        .isEmail()
        .custom(async (value) => {
            if (await userService.isEmailExist(value)) {
                throw new Error('Email already exist.');
            }
        }),
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString(),
    body('birthdate').trim().exists({ values: 'falsy' }).withMessage('Birthdate is required.').isDate().isISO8601(),
    body('contact_number').trim().exists({ values: 'falsy' }).withMessage('Contact number is required.').isString().isNumeric(),
    body('description').trim().optional().isString(),
    ...commonValidation.userTypeIdValidation({ selectionService: selectionService, isOptional: false }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
];
