import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID } from '../../../constants/index.js';

export default ({ selectionService, file, educationService, pfPlanService }) => [
    body('title')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Title is required.')
        .isString()
        .withMessage('Title should be string.')
        .isLength({ max: 150 })
        .withMessage('Title should not exceed 150 characters.')
        .custom(async (value) => {
            if (await educationService.isEducationTitleExist(value)) {
                throw new Error('Education title already exists.');
            }

            return true;
        }),
    body('category_id')
        .exists({ values: 'falsy' })
        .withMessage('Education category is required.')
        .customSanitizer((value) => JSON.parse(value))
        .isArray()
        .withMessage('Education category should be array.')
        .isArray({ min: 1 })
        .withMessage('Education category is required.')
        .custom(async (value) => {
            if (!(await selectionService.isContentCategoryExistById(value))) {
                throw new Error('Education category does not exist.');
            }
        }),
    body('description')
        .trim()
        .exists({ value: 'falsy' })
        .withMessage('Description is required.')
        .isString()
        .withMessage('Description should be string.')
        .isLength({ max: 60 })
        .withMessage('Description should not exceed 60 characters.'),
    body('content').trim().exists({ values: 'falsy' }).withMessage('Content is required.').isString().withMessage('Content should be string.'),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    commonValidation.mediaUrlValidation({ file }),
    commonValidation.mediaUploadValidation({ file }),
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'reference_pf_plan_id', isBody: true, isRequired: false }),
];
