import updatePfPlanValidation from '../pf-plans/update-pf-plan.js';
import userIdValidation from '../common/user-id.js';

export default ({ exerciseService, selectionService, file, educationService, pfPlanService, userService }) => [
    userIdValidation({ userService }).custom(async (value) => {
        const personalizedPfPlan = await pfPlanService.getPfPlanByUserId(value);
        if (personalizedPfPlan.user_id !== value) {
            throw new Error('PF plan does not exist.');
        }
    }),
    ...updatePfPlanValidation({ exerciseService, selectionService, file, educationService, pfPlanService }),
];
