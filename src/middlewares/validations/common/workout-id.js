import { param, body } from 'express-validator';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({ workoutService, field = 'id', isBody = false, isRequired = true, isPublishedOnly = false }) => {
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
            const isWorkoutExist =
                req.auth.account_type_id !== ADMIN_ACCOUNT_TYPE_ID || isPublishedOnly
                    ? await workoutService.isPublishedWorkoutExistById(value)
                    : await workoutService.isWorkoutExistById(value);

            if (!isWorkoutExist) {
                throw new Error('Workout does not exist.');
            }

            return true;
        });

    return rule;
};
