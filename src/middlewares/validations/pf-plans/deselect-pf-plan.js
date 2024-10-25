import * as commonValidation from '../common/index.js';

export default ({ pfPlanService }) => [
    commonValidation.pfPlanIdValidation({ pfPlanService, field: 'id' }).custom(async (value, { req }) => {
        const isPfPlanSelected = await pfPlanService.isPfPlanSelectedById(value, req.auth.user_id);

        if (!isPfPlanSelected) {
            throw new Error('PF plan is not selected.');
        }

        return true;
    }),
];
