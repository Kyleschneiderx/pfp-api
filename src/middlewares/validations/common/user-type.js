import { body } from 'express-validator';

export default ({ selectionService, isOptional = false }) => [
    body('type_id')
        .trim()
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!isOptional && (value === undefined || !value)) throw new Error('User type is required.');

            if (isOptional && (value === undefined || !value)) {
                return true;
            }

            if (value !== undefined) {
                if (!(await selectionService.isUserTypeExist(value))) {
                    throw new Error('User type does not exist.');
                }
            }

            return true;
        }),
];
