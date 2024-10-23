import {
    REPORT_DEFAULT_PAGE,
    REPORT_DEFAULT_ITEMS,
    PREMIUM_USER_TYPE_ID,
    ADMIN_ACCOUNT_TYPE_ID,
    PUBLISHED_WORKOUT_STATUS_ID,
    FAVORITE_WORKOUT_STATUS,
    UNFAVORITE_WORKOUT_STATUS,
    SYSTEM_AUDITS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class WorkoutController {
    constructor({ workoutService, userService, loggerService }) {
        this.workoutService = workoutService;
        this.userService = userService;
        this.loggerService = loggerService;
    }

    async handleCreateWorkoutRoute(req, res) {
        const workout = await this.workoutService.createWorkout({
            name: req.body.name,
            description: req.body.description,
            photo: req?.files?.photo,
            statusId: req.body.status_id,
            isPremium: req.body.is_premium,
            exercises: req.body.exercises,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CREATE_WORKOUT);

        return res.status(201).json(workout);
    }

    async handleGetWorkoutsRoute(req, res) {
        const list = await this.workoutService.getWorkouts({
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

    async handleGetWorkoutRoute(req, res) {
        const user = await this.userService.getUser({ userId: req.auth.user_id });

        const workout = await this.workoutService.getWorkoutDetails(req.params.id, {
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

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_WORKOUT);

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

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.UPDATE_WORKOUT);

        return res.json(workout);
    }

    async handleAddFavoriteWorkoutRoute(req, res) {
        const userWorkoutFavorite = await this.workoutService.updateUserFavoriteWorkouts(req.auth.user_id, req.params.id, FAVORITE_WORKOUT_STATUS);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.ADD_FAVORITE_WORKOUT);

        return res.json(userWorkoutFavorite);
    }

    async handleRemoveFavoriteWorkoutRoute(req, res) {
        await this.workoutService.updateUserFavoriteWorkouts(req.auth.user_id, req.params.id, UNFAVORITE_WORKOUT_STATUS);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_FAVORITE_WORKOUT);

        return res.json({ msg: 'Successfully removed workout to favorites.' });
    }

    async handleGetFavoriteWorkoutsRoute(req, res) {
        const list = await this.workoutService.getWorkouts({
            id: req.query.id,
            name: req.query.name,
            statusId: PUBLISHED_WORKOUT_STATUS_ID,
            favorite: {
                userId: req.auth.user_id,
            },
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });

        return res.json(list);
    }
}
