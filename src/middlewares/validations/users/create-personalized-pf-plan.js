import createPfPlanValidation from '../pf-plans/create-pf-plan.js';
import userIdValidation from '../common/user-id.js';

export default ({ exerciseService, selectionService, file, educationService, pfPlanService, userService }) => [
    userIdValidation({ userService }).custom(async (value) => {
        if (await userService.hasPersonalizePfPlan(value)) {
            throw new Error('Personalize PF plan already exist.');
        }
    }),
    ...createPfPlanValidation({ exerciseService, selectionService, file, educationService, pfPlanService }),
];
