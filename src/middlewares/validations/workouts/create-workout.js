import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID } from '../../../constants/index.js';

export default ({ exerciseService, selectionService, file, workoutService }) => [
    body('name')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Name is required.')
        .isString()
        .isLength({ max: 150 })
        .custom(async (value) => {
            if (await workoutService.isWorkoutNameExist(value)) {
                throw new Error('Workout name already exists.');
            }

            return true;
        }),
    body('description').trim().exists({ values: 'falsy' }).isString(),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    body('is_premium').trim().exists({ value: 'falsy' }).isBoolean(),
    body('exercises')
        .customSanitizer((value) => {
            if (value === '') return undefined;

            try {
                value = JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return value;
        })
        .if(body('status_id').equals(String(PUBLISHED_WORKOUT_STATUS_ID)))
        .exists({ value: 'falsy' })
        .withMessage('Exercises are required.'),
    ...commonValidation.workoutExercisesValidation({ exerciseService }),
];
