import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/workouts/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verifyAdmin, workoutController, workoutService, exerciseService }) => {
    const router = express.Router();

    router.get('/', validateInput(validations.getWorkoutsValidation()), workoutController.handleGetWorkoutsRoute.bind(workoutController));

    router.get(
        '/:id',
        validateInput([commonValidations.workoutIdValidation({ workoutService })]),
        workoutController.handleGetWorkoutRoute.bind(workoutController),
    );

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createWorkoutValidation({ workoutService, exerciseService })),
        workoutController.handleCreateWorkoutRoute.bind(workoutController),
    );

    router.put(
        '/:id',
        validateInput(validations.updateWorkoutValidation({ workoutService, exerciseService })),
        workoutController.handleUpdateWorkoutRoute.bind(workoutController),
    );

    return router;
};
