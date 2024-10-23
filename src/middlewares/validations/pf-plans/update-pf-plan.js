import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_PF_PLAN_STATUS_ID, PUBLISHED_PF_PLAN_STATUS_ID } from '../../../constants/index.js';

export default ({ exerciseService, educationService, pfPlanService, selectionService, file }) => [
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'id' }),
    body('name')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Name is required.')
        .isString()
        .isLength({ max: 150 })
        .custom(async (value, { req }) => {
            if (await pfPlanService.isPfPlanNameExist(value, req.params.id)) {
                throw new Error('PF plan name already exists.');
            }

            return true;
        }),
    body('description').trim().optional().notEmpty().isString(),
    body('content').trim().optional().notEmpty().isString(),
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
    body('dailies.*.daily_id')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('PF plan daily id is required.')
        .custom(async (value, { req }) => {
            if (!(await pfPlanService.isPfPlanDailyExistById(value, req.params.id))) {
                throw new Error('PF plan daily does not exists.');
            }

            return true;
        }),
    body('dailies.*.day')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Day is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('dailies.*.name')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Daily content name is required.')
        .isString()
        .isLength({ max: 150 })
        .custom(async (value, { req, pathValues }) => {
            if (await pfPlanService.isPfPlanDailyNameExist(value, req.body.dailies[pathValues[0]].daily_id, req.params.id)) {
                throw new Error('PF plan daily content name already exists.');
            }

            return true;
        }),
    ...commonValidation.pfPlanDailyContentsValidation({ exerciseService, educationService, pfPlanService }),
];
