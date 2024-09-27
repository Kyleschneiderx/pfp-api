import { param, body } from 'express-validator';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ educationService, field = 'id', isBody = false, isRequired = true }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    if (isRequired) {
        rule.exists({ values: 'falsy' });
    } else {
        rule.optional().notEmpty();
    }

    rule.withMessage('Education id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            if (!(await educationService.isEducationExistById(value))) {
                throw new Error('Education does not exist.');
            }

            const isEducationExist =
                req.auth.account_type_id === ADMIN_ACCOUNT_TYPE_ID
                    ? await educationService.isEducationExistById(value)
                    : await educationService.isPublishedEducationExistById(value);

            if (!isEducationExist) {
                throw new Error('Education does not exist.');
            }

            return true;
        });

    return rule;
};
