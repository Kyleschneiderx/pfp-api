import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_PF_PLAN_STATUS_ID, PUBLISHED_PF_PLAN_STATUS_ID } from '../../../constants/index.js';

export default ({ exerciseService, selectionService, file, educationService, pfPlanService }) => [
    body('name')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Name is required.')
        .isString()
        .isLength({ max: 150 })
        .custom(async (value) => {
            if (await pfPlanService.isPfPlanNameExist(value)) {
                throw new Error('PF plan name already exists.');
            }

            return true;
        }),
    body('description').trim().exists({ value: 'falsy' }).isString(),
    body('content').trim().exists({ value: 'falsy' }).isString(),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_PF_PLAN_STATUS_ID, PUBLISHED_PF_PLAN_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    body('dailies')
        .customSanitizer((value) => {
            if (value === '') return undefined;

            try {
                value = JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return value;
        })
        .if(body('status_id').equals(String(PUBLISHED_PF_PLAN_STATUS_ID)))
        .exists({ value: 'falsy' })
        .withMessage('Daily contents are required.'),
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
        .custom((value, { req, pathValues }) => {
            const duplicate = req.body.dailies.find(
                (daily, index) => index !== Number(pathValues[0]) && daily.name?.toLowerCase() === value?.toLowerCase(),
            );

            if (duplicate !== undefined) {
                throw Error('Duplicate PF plan daily content name.');
            }

            return true;
        }),
    ...commonValidation.pfPlanDailyContentsValidation({ exerciseService, educationService, pfPlanService }),
];
