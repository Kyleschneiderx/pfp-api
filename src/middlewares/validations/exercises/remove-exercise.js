import * as commonValidation from '../common/index.js';

export default ({ exerciseService }) => [
    commonValidation.exerciseIdValidation({ exerciseService }).custom(async (value) => {
        if (await exerciseService.isExerciseAssociatedWithWorkout(value)) {
            throw new Error('Exercise is associated with workout');
        }

        return true;
    }),
];
