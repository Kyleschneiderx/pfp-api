import { param, body } from 'express-validator';

export default ({ pfPlanService, field = 'id', isBody = false }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    rule.exists({ values: 'falsy' })
        .withMessage('PF Plan id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await pfPlanService.isPfPlanExistById(value))) {
                throw new Error('PF Plan does not exist.');
            }
        });

    return rule;
};
