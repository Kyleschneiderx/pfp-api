import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/auth/index.js';

export default ({ authController, userService, password }) => {
    const router = express.Router();

    router.post(
        '/login/admin',
        validateInput(validations.loginValidation({ userService: userService, password: password, isAdmin: true })),
        authController.handleLoginRoute.bind(authController),
    );

    router.post(
        '/login/user',
        validateInput(validations.loginValidation({ userService: userService, password: password, isAdmin: false })),
        authController.handleLoginRoute.bind(authController),
    );

    return router;
};
