import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, file, selectionService }) => [
    ...commonValidation.userIdValidation({ userService }),
    body('email')
        .trim()
        .optional()
        .notEmpty()
        .isString()
        .isEmail()
        .custom(async (value, { req }) => {
            if (await userService.isEmailExistByUserId(value, req.params.user_id)) {
                throw new Error('Email already exist.');
            }
        }),
    body('name').trim().optional().notEmpty().isString(),
    body('birthdate').trim().optional().notEmpty().isDate().isISO8601(),
    body('contact_number').trim().optional().notEmpty().isString().isNumeric(),
    body('description').trim().optional().isString(),
    ...commonValidation.userTypeIdValidation({ selectionService: selectionService, isOptional: true }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
];
