import { param, body } from 'express-validator';

export default ({ workoutService, field = 'id', isBody = false }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    rule.exists({ values: 'falsy' })
        .withMessage('Workout id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await workoutService.isWorkoutExistById(value))) {
                throw new Error('Workout does not exist.');
            }
        });

    return rule;
};
