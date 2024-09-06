import { body } from 'express-validator';

export default ({ isRequired = true, extend = false } = {}) => {
    const rule = body('email').trim();

    if (isRequired) {
        rule.exists({ values: 'falsy' }).withMessage('Email is required.');
    } else {
        rule.optional().notEmpty();
    }

    rule.isString().isEmail().isLength({ max: 150 });

    if (extend) {
        return rule;
    }

    return [rule];
};
