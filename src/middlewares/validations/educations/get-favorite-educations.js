import { query } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default () => [
    query('id')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('title')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : value)),
    ...commonValidation.paginationValidation(),
];
