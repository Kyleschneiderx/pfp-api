import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID } from '../../../constants/index.js';

export default ({ workoutService, exerciseService, selectionService, file }) => [
    commonValidation.workoutIdValidation({ workoutService, field: 'id' }),
    body('name')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Name is required.')
        .isString()
        .withMessage('Name should be string.')
        .isLength({ max: 150 })
        .withMessage('Name should not exceed 150 characters.')
        .custom(async (value, { req }) => {
            if (await workoutService.isWorkoutNameExist(value, req.params.id)) {
                throw new Error('Workout name already exists.');
            }

            return true;
        }),
    body('description').trim().optional().notEmpty().isString().withMessage('Description should be string.'),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
    body('is_premium').trim().optional().notEmpty().isBoolean().withMessage('Is premium should be boolean.'),
    commonValidation
        .statusIdValidation({
            selectionService,
            allowedStatuses: [DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID],
            isRequired: false,
        })
        .if(body('exercises').isEmpty())
        .custom(async (value, { req }) => {
            if (value === PUBLISHED_WORKOUT_STATUS_ID) {
                if (!(await workoutService.hasExercises(req.params.id))) {
                    throw new Error('Workout must have exercises.');
                }
            }
            return true;
        }),
    body('exercises')
        .if(body('exercises').exists({ value: 'falsy' }))
        .customSanitizer((value) => {
            if (value === '') return undefined;

            try {
                value = JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return value;
        }),
    body('exercises.*.workout_exercise_id')
        .optional()
        .notEmpty()
        .withMessage('Workout exercise id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            if (!(await workoutService.isWorkoutExerciseExistById(value, req.params.id))) {
                throw new Error('Workout exercise does not exist.');
            }

            return true;
        }),
    ...commonValidation.workoutExercisesValidation({ exerciseService }),
];
