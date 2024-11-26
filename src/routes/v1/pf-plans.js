import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/pf-plans/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({
    verifyAdmin,
    verifyUser,
    verifyPremiumUser,
    pfPlanController,
    pfPlanService,
    exerciseService,
    selectionService,
    file,
    educationService,
}) => {
    const router = express.Router();

    router.get(
        '/',
        [validateInput(validations.getPfPlansValidation()), verifyPremiumUser],
        pfPlanController.handleGetPfPlansRoute.bind(pfPlanController),
    );

    router.get(
        '/favorites',
        [validateInput(validations.getFavoritePfPlansValidation()), verifyUser, verifyPremiumUser],
        pfPlanController.handleGetFavoritePfPlansRoute.bind(pfPlanController),
    );

    router.post(
        '/:id/favorite',
        [validateInput([validations.updateFavoritePfPlanValidation({ pfPlanService, isFavorite: true })]), verifyUser, verifyPremiumUser],
        pfPlanController.handleAddFavoritePfPlanRoute.bind(pfPlanController),
    );

    router.delete(
        '/:id/favorite',
        [validateInput([validations.updateFavoritePfPlanValidation({ pfPlanService, isUnfavorite: true })]), verifyUser, verifyPremiumUser],
        pfPlanController.handleRemoveFavoritePfPlanRoute.bind(pfPlanController),
    );

    router.put(
        '/:id/select',
        [validateInput(validations.selectPfPlanValidation({ pfPlanService })), verifyUser, verifyPremiumUser],
        pfPlanController.handleSelectPfPlanRoute.bind(pfPlanController),
    );

    router.delete(
        '/:id/deselect',
        [validateInput(validations.deselectPfPlanValidation({ pfPlanService })), verifyUser, verifyPremiumUser],
        pfPlanController.handleDeselectPfPlanRoute.bind(pfPlanController),
    );

    router.put(
        '/:id/progress',
        [
            validateInput(validations.updatePfPlanProgressValidation({ pfPlanService, educationService, exerciseService })),
            verifyUser,
            verifyPremiumUser,
        ],
        pfPlanController.handleUpdatePfPlanProgressRoute.bind(pfPlanController),
    );

    router.get(
        '/:id',
        [validateInput([commonValidations.pfPlanIdValidation({ pfPlanService })]), verifyPremiumUser],
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
