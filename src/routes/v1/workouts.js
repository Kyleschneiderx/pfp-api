import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/workouts/index.js';

export default ({ verifyAdmin, workoutController, workoutService, exerciseService }) => {
    const router = express.Router();

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createWorkoutValidation({ workoutService, exerciseService })),
        workoutController.handleCreateWorkoutRoute.bind(workoutController),
    );

    return router;
};
