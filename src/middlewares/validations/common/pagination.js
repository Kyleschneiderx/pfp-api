import { query } from 'express-validator';

export default () => [
    query('sort')
        .trim()
        .optional()
        .customSanitizer((value) => {
            if (Array.isArray(value)) return value.flatMap((val) => (val.includes(':') ? [val.split(':')] : []));
            return value === '' ? undefined : [value];
        }),
    query('page')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
    query('page_items')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' ? undefined : Number(value))),
];
