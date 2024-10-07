import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ workoutService, pfPlanService }) => [
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'id' }).custom(async (value, { req }) => {
        if (!(await pfPlanService.isPfPlanSelectedById(value, req.auth.user_id))) {
            throw new Error('Invalid PF plan.');
        }

        return true;
    }),
    body('content_id')
        .trim()
        .exists({ value: 'falsy' })
        .withMessage('PF plan content id is required.')
        .custom(async (value, { req }) => {
            const content = await pfPlanService.getPfPlanDailyContentById(req.params.id, value);
            if (!content) {
                throw new Error('Invalid PF plan content.');
            }

            const pfPlanDaily = await pfPlanService.getPfPlanDailyById(req.params.id, content.pf_plan_daily_id);

            content.day = pfPlanDaily.day;

            req.pfPlanContent = content;

            return true;
        }),
    body('is_skip')
        .trim()
        .exists({ value: 'falsy' })
        .isBoolean()
        .customSanitizer((value) => {
            try {
                return JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return false;
        }),
    body('workout_exercise_id')
        .trim()
        .if(body('is_skip').equals(String(false)))
        .if(
            body('content_id').custom((value, { req }) => {
                if (req.pfPlanContent.workout_id === undefined || req.pfPlanContent.workout_id === null) throw new Error();

                return true;
            }),
        )
        .notEmpty()
        .withMessage('PF plan workout exercise id is required.')
        .custom(async (value, { req }) => {
            const workoutExercise = await workoutService.getWorkoutExerciseById(req.pfPlanContent.workout_id, value);
            if (!workoutExercise) {
                throw new Error('Invalid workout exercise.');
            }

            req.workoutExercise = workoutExercise;

            return true;
        }),
];
