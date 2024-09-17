import express from 'express';
import fileUpload from 'express-fileupload';
import routeV1Auth from './v1/auth.js';
import routeV1Users from './v1/users.js';
import routeV1Selections from './v1/selections.js';
import routeV1Verifications from './v1/verifications.js';
import routeV1ForgotPassword from './v1/forgot-password.js';
import routeV1Exercises from './v1/exercises.js';
import routeV1Workouts from './v1/workouts.js';
import routeAsset from './assets.js';
import * as middlewares from '../middlewares/index.js';

export default ({
    apiLogger,
    jwt,
    file,
    password,
    authController,
    userController,
    userService,
    selectionController,
    selectionService,
    loggerService,
    authService,
    verificationController,
    verificationService,
    forgotPasswordController,
    exerciseController,
    exerciseService,
    helper,
    workoutController,
    workoutService,
}) => {
    const router = express.Router();

    const verifyAuth = middlewares.verifyAuth({
        jwt: jwt,
        exceptions: ['/api/v1/users/signup'],
    });

    router.use(fileUpload());

    router.use(
        express.json({
            limit: '100mb',
        }),
    );

    router.use(
        express.urlencoded({
            extended: true,
            limit: '100mb',
        }),
    );

    router.use('/assets', routeAsset({ helper: helper }));

    router.use(
        middlewares.apiLogger({
            logger: apiLogger,
            loggerService: loggerService,
        }),
    );

    router.use(
        '/v1/auths',
        routeV1Auth({
            authController: authController,
            userService: userService,
            password: password,
            authService: authService,
            verifyAuth: verifyAuth,
        }),
    );

    router.use(
        '/v1/verifications',
        routeV1Verifications({
            verificationController: verificationController,
            verificationService: verificationService,
            authService: authService,
            userController: userController,
            userService: userService,
        }),
    );

    router.use(
        '/v1/forgot-password',
        routeV1ForgotPassword({
            forgotPasswordController: forgotPasswordController,
            userService: userService,
            verificationService: verificationService,
            authService: authService,
            password: password,
        }),
    );

    router.use(verifyAuth);

    router.use(
        '/v1/selections',
        routeV1Selections({
            verifyAdmin: middlewares.verifyAdmin,
            selectionController: selectionController,
            selectionService: selectionService,
        }),
    );

    router.use(
        '/v1/users',
        routeV1Users({
            verifyAdmin: middlewares.verifyAdmin,
            userController: userController,
            userService: userService,
            selectionService: selectionService,
            file: file,
            verificationService: verificationService,
            autService: authService,
            password: password,
        }),
    );

    router.use(
        '/v1/exercises',
        routeV1Exercises({
            verifyAdmin: middlewares.verifyAdmin,
            exerciseController: exerciseController,
            exerciseService: exerciseService,
            selectionService: selectionService,
            file: file,
        }),
    );

    router.use(
        '/v1/workouts',
        routeV1Workouts({
            verifyAdmin: middlewares.verifyAdmin,
            workoutController: workoutController,
            workoutService: workoutService,
            exerciseService: exerciseService,
        }),
    );

    router.get('/', (req, res) => {
        res.send('Welcome!');
    });

    return router;
};
