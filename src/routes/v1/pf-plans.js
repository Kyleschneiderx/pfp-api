import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/pf-plans/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verifyAdmin, pfPlanController, pfPlanService, workoutService, selectionService, file, educationService }) => {
    const router = express.Router();

    router.get('/', validateInput(validations.getPfPlansValidation()), pfPlanController.handleGetPfPlansRoute.bind(pfPlanController));

    router.get(
        '/:id',
        validateInput([commonValidations.pfPlanIdValidation({ pfPlanService })]),
        pfPlanController.handleGetPfPlanRoute.bind(pfPlanController),
    );

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createPfPlanValidation({ pfPlanService, workoutService, selectionService, file, educationService })),
        pfPlanController.handleCreatePfPlanRoute.bind(pfPlanController),
    );

    router.put(
        '/:id',
        validateInput(validations.updatePfPlanValidation({ pfPlanService, workoutService, selectionService, file })),
        pfPlanController.handleUpdatePfPlanRoute.bind(pfPlanController),
    );

    router.delete(
        '/:id',
        validateInput([commonValidations.pfPlanIdValidation({ pfPlanService })]),
        pfPlanController.handleRemovePfPlanRoute.bind(pfPlanController),
    );

    return router;
};
