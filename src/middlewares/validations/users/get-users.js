import { query } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default () => [
    query('id')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('email')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : value)),
    query('name')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : value)),
    query('status_id')
        .trim()
        .optional()
        .customSanitizer((value) => {
            if (!Array.isArray(value)) {
                value = [value];
            }

            return value.map((val) => Number(val));
        }),
    ...commonValidation.paginationValidation(),
];
