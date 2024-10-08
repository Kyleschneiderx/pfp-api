import * as commonValidation from '../common/index.js';

export default ({ educationService, isFavorite = false, isUnfavorite = false }) =>
    commonValidation.educationIdValidation({ educationService, field: 'id' }).custom(async (value, { req }) => {
        const isFavoriteExist = await educationService.isFavoriteEducationExistById(value, req.auth.user_id);

        if (isFavoriteExist && isFavorite) {
            throw new Error('Education is already in favorite list.');
        }

        if (!isFavoriteExist && isUnfavorite) {
            throw new Error('Education is not yet in favorite list.');
        }

        return true;
    });
