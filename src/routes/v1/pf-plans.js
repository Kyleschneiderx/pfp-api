import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/pf-plans/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verifyAdmin, verifyUser, pfPlanController, pfPlanService, exerciseService, selectionService, file, educationService }) => {
    const router = express.Router();

    router.get('/', validateInput(validations.getPfPlansValidation()), pfPlanController.handleGetPfPlansRoute.bind(pfPlanController));

    router.get(
        '/favorites',
        [validateInput(validations.getFavoritePfPlansValidation()), verifyUser],
        pfPlanController.handleGetFavoritePfPlansRoute.bind(pfPlanController),
    );

    router.post(
        '/:id/favorite',
        [validateInput([validations.updateFavoritePfPlanValidation({ pfPlanService, isFavorite: true })]), verifyUser],
        pfPlanController.handleAddFavoritePfPlanRoute.bind(pfPlanController),
    );

    router.delete(
        '/:id/favorite',
        [validateInput([validations.updateFavoritePfPlanValidation({ pfPlanService, isUnfavorite: true })]), verifyUser],
        pfPlanController.handleRemoveFavoritePfPlanRoute.bind(pfPlanController),
    );

    router.put(
        '/:id/select',
        [validateInput(validations.selectPfPlanValidation({ pfPlanService })), verifyUser],
        pfPlanController.handleSelectPfPlanRoute.bind(pfPlanController),
    );

    router.delete(
        '/:id/deselect',
        [validateInput(validations.deselectPfPlanValidation({ pfPlanService })), verifyUser],
        pfPlanController.handleDeselectPfPlanRoute.bind(pfPlanController),
    );

    router.put(
        '/:id/progress',
        [validateInput(validations.updatePfPlanProgressValidation({ pfPlanService, educationService, exerciseService })), verifyUser],
        pfPlanController.handleUpdatePfPlanProgressRoute.bind(pfPlanController),
    );

    router.get(
        '/:id',
        validateInput([commonValidations.pfPlanIdValidation({ pfPlanService })]),
        pfPlanController.handleGetPfPlanRoute.bind(pfPlanController),
    );

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createPfPlanValidation({ pfPlanService, exerciseService, selectionService, file, educationService })),
        pfPlanController.handleCreatePfPlanRoute.bind(pfPlanController),
    );

    router.put(
        '/:id',
        validateInput(validations.updatePfPlanValidation({ pfPlanService, exerciseService, educationService, selectionService, file })),
        pfPlanController.handleUpdatePfPlanRoute.bind(pfPlanController),
    );

    router.delete(
        '/:id',
        validateInput([commonValidations.pfPlanIdValidation({ pfPlanService })]),
        pfPlanController.handleRemovePfPlanRoute.bind(pfPlanController),
    );

    return router;
};
