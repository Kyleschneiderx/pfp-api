import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, file, selectionService }) => [
    commonValidation.userIdValidation({ userService }),
    commonValidation
        .emailValidation()
        .optional()
        .notEmpty()
        .custom(async (value, { req }) => {
            if (await userService.isEmailExistByUserId(value, req.params.user_id)) {
                throw new Error('Email already exist.');
            }
        }),
    body('name')
        .trim()
        .optional()
        .notEmpty()
        .isString()
        .withMessage('Name should be string.')
        .isLength({ max: 150 })
        .withMessage('Name should not exceed 150 characters.'),
    body('birthdate')
        .trim()
        .optional()
        .notEmpty()
        .isDate()
        .withMessage('Birthdate should be valid date.')
        .isISO8601()
        .withMessage('Invalid date format.')
        .isBefore(new Date().toUTCString())
        .withMessage('Birthdate should be before today.'),
    body('contact_number')
        .trim()
        .optional()
        .notEmpty()
        .isString()
        .withMessage('Contact number should be string.')
        .isLength({ max: 20 })
        .withMessage('Contact number should not exceed 20 characters.')
        .isNumeric()
        .withMessage('Contact number should be numeric.'),
    body('description').trim().optional().isString().withMessage('Description should be string.'),
    commonValidation.userTypeIdValidation({ selectionService: selectionService, isOptional: true }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
];
