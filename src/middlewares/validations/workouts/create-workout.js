import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID } from '../../../constants/index.js';

export default ({ exerciseService, selectionService, file }) => [
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('description').trim().optional().isString().isLength({ max: 200 }),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    body('exercises')
        // .if(body('exercises').exists({ value: 'falsy' }))

        .if(body('status_id').equals(String(PUBLISHED_WORKOUT_STATUS_ID)))
        .customSanitizer((value) => {
            if (value === '') return undefined;

            try {
                value = JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return value;
        })
        .exists({ value: 'falsy' }),
    commonValidation.exerciseIdValidation({ exerciseService, isBody: true, field: 'exercises.*.exercise_id' }),
    body('exercises.*.sets')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of sets is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('exercises.*.reps')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('exercises.*.hold')
        .trim()
        .exists()
        .withMessage('Number of hold is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
];
