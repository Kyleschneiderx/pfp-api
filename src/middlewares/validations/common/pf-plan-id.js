import { param, body } from 'express-validator';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ pfPlanService, field = 'id', isBody = false, isFavorite = false, isUnfavorite = false, isSelected = false }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    rule.exists({ values: 'falsy' })
        .withMessage('PF Plan id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            const isPfPlanExist =
                req.auth.account_type_id === ADMIN_ACCOUNT_TYPE_ID
                    ? await pfPlanService.isPfPlanExistById(value)
                    : await pfPlanService.isPublishedPfPlanExistById(value);

            if (!isPfPlanExist) {
                throw new Error('PF Plan does not exist.');
            }

            return true;
        });

    if (isFavorite || isUnfavorite) {
        rule.custom(async (value, { req }) => {
            const isFavoriteExist = await pfPlanService.isFavoritePfPlanExistById(value, req.auth.user_id);

            if (isFavoriteExist && isFavorite) {
                throw new Error('PF plan is already in favorite list.');
            }

            if (!isFavoriteExist && isUnfavorite) {
                throw new Error('PF plan is not yet in favorite list.');
            }

            return true;
        });
    }

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
