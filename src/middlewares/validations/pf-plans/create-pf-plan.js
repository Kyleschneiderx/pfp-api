import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID } from '../../../constants/index.js';

export default ({ workoutService, selectionService, file, educationService }) => [
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('description').trim().optional().isString(),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_WORKOUT_STATUS_ID, PUBLISHED_WORKOUT_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    body('dailies')
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
    commonValidation.workoutIdValidation({ workoutService, isBody: true, isRequired: false, field: 'dailies.*.workout_id' }),
    commonValidation.educationIdValidation({ educationService, isBody: true, isRequired: false, field: 'dailies.*.education_id' }),
];
