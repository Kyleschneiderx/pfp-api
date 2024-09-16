import { query } from 'express-validator';

export default () => [
    query('sort')
        .trim()
        .optional()
        .customSanitizer((value) => {
            if (!Array.isArray(value)) {
                value = [value];
            }
            return value.flatMap((val) => (val.includes(':') ? [val.split(':')] : [['id', val]]));
        })
        .custom((value) => {
            value.forEach((val) => {
                const [, order] = val;
                if (order.toLowerCase() !== 'asc' && order.toLowerCase() !== 'desc') throw new Error('Invalid sort order');
            });

            return true;
        }),

    query('page')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' || value === 0 ? undefined : Number(value))),
    query('page_items')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' || value === 0 ? undefined : Number(value))),
];
