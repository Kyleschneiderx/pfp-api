import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/users/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({ verifyAdmin, userController, userService, file, selectionService, verificationService, authService, password }) => {
    const router = express.Router();

    router.post(
        '/signup',
        validateInput(validations.signupValidation({ userService, file, verificationService, authService })),
        userController.handleUserSignupRoute.bind(userController),
    );

    router.get(
        '/:user_id',
        validateInput(commonValidations.userAccessUserIdValidation({ userService })),
        userController.handleGetUserRoute.bind(userController),
    );

    router.put(
        '/:user_id/password',
        validateInput(validations.changePasswordValidation({ userService, password })),
        userController.handleChangePasswordRoute.bind(userController),
    );

    router.use(verifyAdmin);

    router.post(
        '/',
        validateInput(validations.createUserValidation({ userService, file, selectionService })),
        userController.handleCreateUserRoute.bind(userController),
    );

    router.put(
        '/:user_id',
        validateInput(validations.updateUserValidation({ userService, file, selectionService })),
        userController.handleUpdateUserRoute.bind(userController),
    );

    router.delete(
        '/:user_id',
        validateInput(validations.removeUserValidation({ userService })),
        userController.handleRemoveUserRoute.bind(userController),
    );

    router.get('/', validateInput(validations.getUsersValidation()), userController.handleGetUsersRoute.bind(userController));

    router.delete(
        '/:user_id/photo',
        validateInput(commonValidations.userIdValidation({ userService })),
        userController.handleRemoveUserPhotoRoute.bind(userController),
    );

    return router;
};
