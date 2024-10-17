import { param, body } from 'express-validator';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ pfPlanService, field = 'id', isRequired = true, isBody = false, isSelected = false }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    if (isRequired) {
        rule.exists({ values: 'falsy' }).withMessage('PF Plan id is required.');
    } else {
        rule.optional().notEmpty();
    }

    rule.customSanitizer((value) => (value === 'null' ? null : Number(value))).custom(async (value, { req }) => {
        if (value === null) {
            return true;
        }

        const isPfPlanExist =
            req.auth.account_type_id === ADMIN_ACCOUNT_TYPE_ID
                ? await pfPlanService.isPfPlanExistById(value)
                : await pfPlanService.isPublishedPfPlanExistById(value);

        if (!isPfPlanExist) {
            throw new Error('PF Plan does not exist.');
        }

        return true;
    });

    if (isSelected) {
        rule.custom(async (value, { req }) => {
            const isPfPlanSelected = await pfPlanService.isPfPlanSelectedById(value, req.auth.user_id);

            if (isPfPlanSelected) {
                throw new Error('PF plan is already selected.');
            }

            return true;
        });
    }

    return rule;
};
