import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID } from '../../../constants/index.js';

export default ({ workoutService, educationService, selectionService, file }) => [
    commonValidation.workoutIdValidation({ workoutService, field: 'id' }),
    body('name').trim().optional().notEmpty().withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('description').trim().optional().notEmpty().isString(),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    body('dailies')
        .customSanitizer((value) => (value === '' ? undefined : value))
        .if(body('dailies').exists({ value: 'falsy' }))
        .customSanitizer((value) => {
            try {
                value = JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return value;
        }),
    body('dailies.*.day')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Day is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    commonValidation.workoutIdValidation({ workoutService, isBody: true, isRequired: false, isPublishedOnly: true, field: 'dailies.*.workout_id' }),
    commonValidation.educationIdValidation({
        educationService,
        isBody: true,
        isRequired: false,
        isPublishedOnly: true,
        field: 'dailies.*.education_id',
    }),
];
