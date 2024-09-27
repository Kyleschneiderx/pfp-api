import { param, body } from 'express-validator';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ workoutService, field = 'id', isBody = false, isRequired = true }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    if (isRequired) {
        rule.exists({ values: 'falsy' });
    } else {
        rule.optional().notEmpty();
    }

    rule.withMessage('Workout id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            const isPfPlanExist =
                req.auth.account_type_id === ADMIN_ACCOUNT_TYPE_ID
                    ? await workoutService.isWorkoutExistById(value)
                    : await workoutService.isPublishedWorkoutExistById(value);

            if (!isPfPlanExist) {
                throw new Error('Workout does not exist.');
            }

            return true;
        });

    return rule;
};
