import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ pfPlanService }) => [
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'id' }).custom(async (value, { req }) => {
        if (!(await pfPlanService.isPfPlanSelectedById(value, req.auth.user_id))) {
            throw new Error('Invalid PF plan.');
        }

        return true;
    }),
    body('daily_id')
        .trim()
        .exists({ value: 'falsy' })
        .withMessage('PF plan daily id is required.')
        .custom(async (value, { req }) => {
            const pfPlanDaily = await pfPlanService.getPfPlanDailyById(req.params.id, value);
            if (!pfPlanDaily) {
                throw new Error('Invalid PF plan daily.');
            }

            req.pfPlanDaily = pfPlanDaily;

            return true;
        }),
    body('content_id')
        .optional()
        .notEmpty()
        .withMessage('PF plan content id is required.')
        .custom(async (value, { req }) => {
            const content = await pfPlanService.getPfPlanDailyContentById(req.params.id, value);
            if (!content) {
                throw new Error('Invalid PF plan content.');
            }

            req.pfPlanContent = content;

            return true;
        }),
    body('is_skip')
        .trim()
        .exists({ value: 'falsy' })
        .isBoolean()
        .withMessage('Is skip should be boolean.')
        .customSanitizer((value) => {
            try {
                return JSON.parse(value);
            } catch (error) {
                /** empty */
            }

            return false;
        }),
];
