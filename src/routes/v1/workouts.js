import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/workouts/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verifyAdmin, workoutController, workoutService, exerciseService, selectionService, file }) => {
    const router = express.Router();

    router.get('/', validateInput(validations.getWorkoutsValidation()), workoutController.handleGetWorkoutsRoute.bind(workoutController));

    router.get(
        '/favorites',
        validateInput(validations.getFavoriteWorkoutsValidation()),
        workoutController.handleGetFavoriteWorkoutsRoute.bind(workoutController),
    );

    router.get(
        '/:id',
        validateInput([commonValidations.workoutIdValidation({ workoutService })]),
        workoutController.handleGetWorkoutRoute.bind(workoutController),
    );

    router.post(
        '/:id/favorite',
        validateInput([validations.updateFavoriteWorkoutValidation({ workoutService, isFavorite: true })]),
        workoutController.handleAddFavoriteWorkoutRoute.bind(workoutController),
    );

    router.delete(
        '/:id/favorite',
        validateInput([validations.updateFavoriteWorkoutValidation({ workoutService, isUnfavorite: true })]),
        workoutController.handleRemoveFavoriteWorkoutRoute.bind(workoutController),
    );

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createWorkoutValidation({ workoutService, exerciseService, selectionService, file })),
        workoutController.handleCreateWorkoutRoute.bind(workoutController),
    );

    router.put(
        '/:id',
        validateInput(validations.updateWorkoutValidation({ workoutService, exerciseService, selectionService, file })),
        workoutController.handleUpdateWorkoutRoute.bind(workoutController),
    );

    router.delete(
        '/:id',
        validateInput(validations.removeWorkoutValidation({ workoutService })),
        workoutController.handleRemoveWorkoutRoute.bind(workoutController),
    );

    return router;
};
