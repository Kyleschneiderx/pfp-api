import * as commonValidation from '../common/index.js';

export default ({ workoutService, isFavorite = false, isUnfavorite = false }) =>
    commonValidation.workoutIdValidation({ workoutService, field: 'id' }).custom(async (value, { req }) => {
        const isFavoriteExist = await workoutService.isFavoriteWorkoutExistById(value, req.auth.user_id);

        if (isFavoriteExist && isFavorite) {
            throw new Error('Workout is already in favorite list.');
        }

        if (!isFavoriteExist && isUnfavorite) {
            throw new Error('Workout is not yet in favorite list.');
        }

        return true;
    });
