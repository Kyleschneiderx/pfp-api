import { param, body } from 'express-validator';

export default ({ educationService, field = 'id', isBody = false, isRequired = true, isPublishedOnly = false }) => {
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
            const isEducationExist = await educationService.isEducationExistById(value);

            if (!isEducationExist) {
                throw new Error('Education does not exist.');
            }

            return true;
        });

    return rule;
};
