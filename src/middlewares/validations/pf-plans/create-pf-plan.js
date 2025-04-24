import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_PF_PLAN_STATUS_ID, PUBLISHED_PF_PLAN_STATUS_ID } from '../../../constants/index.js';

export default ({ exerciseService, selectionService, file, educationService, pfPlanService }) => [
    body('name')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Name is required.')
        .isString()
        .withMessage('Name should be string.')
        .isLength({ max: 150 })
        .withMessage('Name should not exceed 150 characters.')
        .custom(async (value) => {
            if (await pfPlanService.isPfPlanNameExist(value)) {
                throw new Error('PF plan name already exists.');
            }

            return true;
        }),
    body('description').trim().exists({ value: 'falsy' }).isString().withMessage('Description should be string.'),
    body('category_id')
        .optional()
        .customSanitizer((value) => JSON.parse(value))
        .isArray()
        .withMessage('PF plan category should be array.')
        .custom(async (value) => {
            if (value.length > 0) {
                const isCategoryExistMap = await Promise.all(value.map((category) => selectionService.isContentCategoryExistById(category)));

                if (isCategoryExistMap.includes(false)) {
                    throw new Error(`PF plan category  does not exist.`);
                }
            }
        }),
    body('is_custom')
        .exists({ values: 'falsy' })
        .withMessage('PF plan custom state is required.')
        .customSanitizer((value) => {
            try {
                value = JSON.parse(value);
            } catch (error) {
                /** empty */
            }
            return value;
        })
        .isBoolean()
        .withMessage('PF plan custom state should be boolean.'),
    body('content').trim().exists({ value: 'falsy' }).isString().withMessage('Content should be string.'),
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
        .isNumeric()
        .withMessage('Day should be numeric.'),
    body('dailies.*.name')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Daily content name is required.')
        .isString()
        .withMessage('Daily content name should be string.')
        .isLength({ max: 150 })
        .withMessage('Daily content name should not exceed 150 characters.')
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
