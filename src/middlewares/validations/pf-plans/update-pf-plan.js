import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_PF_PLAN_STATUS_ID, PUBLISHED_PF_PLAN_STATUS_ID } from '../../../constants/index.js';

export default ({ workoutService, educationService, pfPlanService, selectionService, file }) => [
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'id' }),
    body('name').trim().optional().notEmpty().withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('description').trim().optional().notEmpty().isString(),
    commonValidation
        .statusIdValidation({
            selectionService,
            allowedStatuses: [DRAFT_PF_PLAN_STATUS_ID, PUBLISHED_PF_PLAN_STATUS_ID],
            isRequired: false,
        })
        .if(body('dailies').isEmpty())
        .custom(async (value, { req }) => {
            if (value === PUBLISHED_PF_PLAN_STATUS_ID) {
                if (!(await pfPlanService.hasDailies(req.params.id))) {
                    throw new Error('PF plan must have daily content.');
                }
            }
            return true;
        }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
    body('dailies')
        .if(body('dailies').exists({ value: 'falsy' }))
        .customSanitizer((value) => {
            if (value === '') return undefined;

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
