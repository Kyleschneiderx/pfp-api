import { query } from 'express-validator';

export default () => [
    query('sort')
        .trim()
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) {
                value.forEach((val) => {
                    if (val.includes(':')) {
                        const [, order] = val.split(':');
                        if (order.toLowerCase() !== 'asc' && order.toLowerCase() !== 'desc') throw new Error('Invalid sort order');
                    }
                });
            }

            return true;
        })
        .customSanitizer((value) => value.flatMap((val) => (val.includes(':') ? [val.split(':')] : [['id', val]]))),
    query('page')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' || value === 0 ? undefined : Number(value))),
    query('page_items')
        .trim()
        .optional()
        .customSanitizer((value) => (value === '' || value === 0 ? undefined : Number(value))),
];
