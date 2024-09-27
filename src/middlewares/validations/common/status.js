import { body } from 'express-validator';

export default ({ selectionService, allowedStatuses = undefined, isRequired = true }) => {
    if (allowedStatuses && !Array.isArray(allowedStatuses)) {
        allowedStatuses = [allowedStatuses];
    }

    const rule = body('status_id');
    if (isRequired) {
        rule.exists({ values: 'falsy' });
    } else {
        rule.optional().notEmpty();
    }

    return rule
        .withMessage('Status id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (allowedStatuses && !allowedStatuses.includes(value)) {
                throw new Error('Invalid status.');
            }

            if (!(await selectionService.isStatusExistById(value))) {
                throw new Error('Status does not exist.');
            }
        });
};
