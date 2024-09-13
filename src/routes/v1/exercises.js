import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/exercises/index.js';

export default ({ verifyAdmin, exerciseController, exerciseService, selectionService, file }) => {
    const router = express.Router();

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createExerciseValidation({ exerciseService, file, selectionService })),
        exerciseController.handleCreateExerciseRoute.bind(exerciseController),
    );

    return router;
};
