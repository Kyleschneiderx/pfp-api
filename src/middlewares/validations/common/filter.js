import { query } from 'express-validator';

export default ({ field, isString = false, isInt = false }) => {
    const rule = query(field).trim().optional();

    if (isString) {
        rule.customSanitizer((value) => (value === '' ? undefined : value));
    }

    if (isInt) {
        rule.customSanitizer((value) => (value === '' ? undefined : Number(value)));
    }

    return rule;
};
