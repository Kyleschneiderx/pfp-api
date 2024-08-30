import { query } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default () => [
    query('user_id')
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
