import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/auth/index.js';

export default ({ authController }) => {
    const router = express.Router();

    router.post('/login', validateInput(validations.loginValidation()), authController.handleLoginRoute.bind(authController));

    return router;
};
