import * as commonValidation from '../common/index.js';

export default ({ pfPlanService, isFavorite = false, isUnfavorite = false }) =>
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'id' }).custom(async (value, { req }) => {
        const isFavoriteExist = await pfPlanService.isFavoritePfPlanExistById(value, req.auth.user_id);

        if (isFavoriteExist && isFavorite) {
            throw new Error('PF plan is already in favorite list.');
        }

        if (!isFavoriteExist && isUnfavorite) {
            throw new Error('PF plan is not yet in favorite list.');
        }

        return true;
    });
