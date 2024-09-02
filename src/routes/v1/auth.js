import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/auth/index.js';

export default ({ authController }) => {
    const router = express.Router();

    router.post('/login/admin', validateInput(validations.loginValidation()), authController.handleLoginAdminRoute.bind(authController));

    router.post('/login/user', validateInput(validations.loginValidation()), authController.handleLoginUserRoute.bind(authController));

    return router;
};
