import * as commonValidation from '../common/index.js';

export default ({ workoutService }) => [
    commonValidation.workoutIdValidation({ workoutService, field: 'id' }).custom(async (value) => {
        if (await workoutService.isWorkoutAssociatedWithPfPlan(value)) {
            throw new Error('Workout is associated with a PF plan');
        }

        return true;
    }),
];
