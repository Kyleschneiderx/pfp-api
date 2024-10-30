import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';
import { DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID } from '../../../constants/index.js';

export default ({ educationService, selectionService, file, pfPlanService }) => [
    commonValidation.educationIdValidation({ educationService, field: 'id' }),
    body('title')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Title is required.')
        .isString()
        .withMessage('Title should be string.')
        .isLength({ max: 150 })
        .withMessage('Title should not exceed 150 characters.')
        .custom(async (value, { req }) => {
            if (await educationService.isEducationTitleExist(value, req.params.id)) {
                throw new Error('Education title already exists.');
            }

            return true;
        }),
    body('description')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Description is required.')
        .isString()
        .withMessage('Description should be string.')
        .isLength({ max: 60 })
        .withMessage('Description should not exceed 60 characters.'),
    body('content').trim().optional().notEmpty().isString().withMessage('Content should be string.'),
    commonValidation.statusIdValidation({
        selectionService,
        allowedStatuses: [DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID],
        isRequired: false,
    }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
    commonValidation.mediaUrlValidation({ file }),
    commonValidation.mediaUploadValidation({ file }),
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'reference_pf_plan_id', isBody: true, isRequired: false }),
];
