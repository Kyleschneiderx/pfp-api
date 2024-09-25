import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/educations/index.js';

export default ({ verifyAdmin, educationController, educationService, selectionService, file }) => {
    const router = express.Router();

    router.get('/', validateInput(validations.getEducationsValidation()), educationController.handleGetEducationsRoute.bind(educationController));

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createEducationValidation({ educationService, selectionService, file })),
        educationController.handleCreateEducationRoute.bind(educationController),
    );

    return router;
};
