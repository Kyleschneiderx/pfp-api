import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/selections/index.js';

export default ({ verifyAdmin, selectionController, selectionService, miscellaneousService }) => {
    const router = express.Router();

    router.get('/', selectionController.handleSelectionsRoute.bind(selectionController));

    router.use(verifyAdmin);

    router.post(
        '/exercise-categories',
        validateInput(validations.exerciseCategoryValidation({ selectionService })),
        selectionController.handleCreateExerciseCategoryRoute.bind(selectionController),
    );

    router.put(
        '/exercise-categories/:id',
        validateInput(validations.exerciseCategoryValidation({ selectionService, isUpdate: true })),
        selectionController.handleUpdateExerciseCategoryRoute.bind(selectionController),
    );

    router.delete(
        '/exercise-categories/:id',
        validateInput(validations.exerciseCategoryValidation({ selectionService, isDelete: true })),
        selectionController.handleRemoveExerciseCategoryRoute.bind(selectionController),
    );

    router.post(
        '/content-categories',
        validateInput(validations.contentCategoryValidation({ selectionService, miscellaneousService })),
        selectionController.handleCreateContentCategoryRoute.bind(selectionController),
    );

    router.put(
        '/content-categories/:id',
        validateInput(validations.contentCategoryValidation({ selectionService, miscellaneousService, isUpdate: true })),
        selectionController.handleUpdateContentCategoryRoute.bind(selectionController),
    );

    router.delete(
        '/content-categories/:id',
        validateInput(validations.contentCategoryValidation({ selectionService, miscellaneousService, isDelete: true })),
        selectionController.handleRemoveContentCategoryRoute.bind(selectionController),
    );

    return router;
};
