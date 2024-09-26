import {
    REPORT_DEFAULT_PAGE,
    REPORT_DEFAULT_ITEMS,
    PREMIUM_USER_TYPE_ID,
    ADMIN_ACCOUNT_TYPE_ID,
    PUBLISHED_WORKOUT_STATUS_ID,
    FAVORITE_WORKOUT_STATUS,
    UNFAVORITE_WORKOUT_STATUS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class EducationController {
    constructor({ educationService, userService }) {
        this.educationService = educationService;
        this.userService = userService;
    }

    async handleCreateEducationRoute(req, res) {
        const education = await this.educationService.createEducation({
            title: req.body.title,
            content: req.body.content,
            mediaUrl: req.body.media_url,
            mediaUpload: req?.files?.media_upload,
            photo: req?.files?.photo,
            statusId: req.body.status_id,
        });
        return res.status(201).json(education);
    }

    async handleGetEducationsRoute(req, res) {
        const list = await this.educationService.getEducations({
            id: req.query.id,
            name: req.query.name,
            statusId: req.query.status_id,
            sort: req.query.sort,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_WORKOUT_STATUS_ID,
            }),
        });
        return res.json(list);
    }

    async handleGetEducationRoute(req, res) {
        const user = await this.userService.getUser({ userId: req.auth.user_id });

        const workout = await this.educationService.getEducationDetails(req.params.id, {
            authenticatedUser: req.auth,
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_WORKOUT_STATUS_ID,
            }),
        });

        if (user.account_type_id !== ADMIN_ACCOUNT_TYPE_ID && workout.is_premium && !(workout.is_premium && user.type_id === PREMIUM_USER_TYPE_ID)) {
            throw new exceptions.Forbidden('You cannot access this content.');
        }

        return res.json(workout);
    }

    async handleRemoveWorkoutRoute(req, res) {
        await this.workoutService.removeWorkout(req.params.id);

        return res.json({ msg: 'Successfully removed workout.' });
    }

    async handleUpdateWorkoutRoute(req, res) {
        const workout = await this.workoutService.updateWorkout({
            id: req.params.id,
            name: req.body.name,
            description: req.body.description,
            photo: req?.files?.photo,
            statusId: req.body.status_id,
            isPremium: req.body.is_premium,
            exercises: req.body.exercises,
        });
        return res.json(workout);
    }

    async handleAddFavoriteWorkoutRoute(req, res) {
        const userWorkoutFavorite = await this.workoutService.updateUserFavoriteWorkouts(req.auth.user_id, req.params.id, FAVORITE_WORKOUT_STATUS);

        return res.json(userWorkoutFavorite);
    }

    async handleRemoveFavoriteWorkoutRoute(req, res) {
        await this.workoutService.updateUserFavoriteWorkouts(req.auth.user_id, req.params.id, UNFAVORITE_WORKOUT_STATUS);
        return res.json({ msg: 'Successfully removed workout to favorites.' });
    }

    async handleGetFavoriteWorkoutsRoute(req, res) {
        const favorites = await this.workoutService.getFavoriteWorkouts(req.auth.user_id);

        return res.json({
            data: favorites,
        });
    }
}
