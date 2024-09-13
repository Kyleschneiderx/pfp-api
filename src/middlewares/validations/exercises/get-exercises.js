import { query } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default () => [
    query('id')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('category_id')
        .trim()
        .optional()
        .customSanitizer((value) => {
            if (value === '') return undefined;

            if (!Array.isArray(value)) {
                value = [value];
            }
            return value;
        }),
    query('sets_from')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('sets_to')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('reps_from')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('reps_to')
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
    ...commonValidation.paginationValidation(),
];
