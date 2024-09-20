import {
    REPORT_DEFAULT_PAGE,
    REPORT_DEFAULT_ITEMS,
    PREMIUM_USER_TYPE_ID,
    ADMIN_ACCOUNT_TYPE_ID,
    PUBLISHED_WORKOUT_STATUS_ID,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class WorkoutController {
    constructor({ workoutService, userService }) {
        this.workoutService = workoutService;
        this.userService = userService;
    }

    async handleCreateWorkoutRoute(req, res) {
        const workout = await this.workoutService.createWorkout({
            name: req.body.name,
            description: req.body.description,
            statusId: req.body.status_id,
            exercises: req.body.exercises,
        });
        return res.status(201).json(workout);
    }

    async handleGetWorkoutsRoute(req, res) {
        const list = await this.workoutService.getWorkouts({
            id: req.query.id,
            name: req.query.name,
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
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_WORKOUT_STATUS_ID,
            }),
        });

        if (user.account_type_id !== ADMIN_ACCOUNT_TYPE_ID && !(workout.is_premium && user.type_id === PREMIUM_USER_TYPE_ID)) {
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
            statusId: req.body.status_id,
            isPremium: req.body.is_premium,
            exercises: req.body.exercises,
        });
        return res.json(workout);
    }
}
