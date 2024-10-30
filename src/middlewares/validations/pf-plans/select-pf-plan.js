import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ pfPlanService }) => [
    commonValidation
        .pfPlanIdValidation({ pfPlanService, field: 'id' })
        .if(body('is_start_over').equals('false'))
        .custom(async (value, { req }) => {
            const isPfPlanSelected = await pfPlanService.isPfPlanSelectedById(value, req.auth.user_id);

            if (isPfPlanSelected) {
                throw new Error('PF plan is already selected.');
            }

            return true;
        }),
    body('is_start_over').optional().notEmpty().isBoolean().withMessage('Is start over should be boolean.'),
];
