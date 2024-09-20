import { body } from 'express-validator';

export default ({ selectionService, allowedStatuses = undefined }) => {
    if (allowedStatuses && !Array.isArray(allowedStatuses)) {
        allowedStatuses = [allowedStatuses];
    }

    return body('status_id')
        .exists({ values: 'falsy' })
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
