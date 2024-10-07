import * as commonValidation from '../common/index.js';

export default ({ userService, pfPlanService }) => [
    commonValidation.userAccessUserIdValidation({ userService }).custom(async (value, { req }) => {
        req.selectedPlan = await pfPlanService.getSelectedPfPlanByUserId(req.auth.user_id);

        if (!req.selectedPlan) {
            throw new Error('User does not have a selected PF plan.');
        }

        return true;
    }),
];
