import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID } from '../../../constants/index.js';

export default ({ selectionService, file, educationService, pfPlanService }) => [
    body('title')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Title is required.')
        .isString()
        .isLength({ max: 150 })
        .custom(async (value) => {
            if (await educationService.isEducationTitleExist(value)) {
                throw new Error('Education title already exists.');
            }

            return true;
        }),
    body('description')
        .trim()
        .exists({ value: 'falsy' })
        .withMessage('Description is required.')
        .isString()
        .isLength({ max: 60 })
        .withMessage('Description cannot exceed 60 characters.'),
    body('content').trim().exists({ values: 'falsy' }).withMessage('Content is required.').isString(),
    commonValidation.statusIdValidation({ selectionService, allowedStatuses: [DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID] }),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    commonValidation.mediaUrlValidation({ file }),
    commonValidation.mediaUploadValidation({ file }),
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'reference_pf_plan_id', isBody: true, isRequired: false }),
];
