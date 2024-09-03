import express from 'express';
import fileUpload from 'express-fileupload';
import routeV1Auth from './v1/auth.js';
import routeV1Users from './v1/users.js';
import routeV1Selections from './v1/selections.js';
import * as middlewares from '../middlewares/index.js';

export default ({ logger, apiLogger, jwt, file, password, authController, userController, userService, selectionController, selectionService }) => {
    const router = express.Router();

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

    router.use(
        middlewares.apiLogger({
            logger: logger,
            apiLogger: apiLogger,
        }),
    );

    router.use(
        '/v1/selections',
        routeV1Selections({
            selectionController: selectionController,
        }),
    );

    router.use(
        '/v1/auths',
        routeV1Auth({
            authController: authController,
            userService: userService,
            password: password,
        }),
    );

    router.use(middlewares.verifyAuth({ jwt: jwt }));

    router.use(
        '/v1/users',
        routeV1Users({
            verifyAdmin: middlewares.verifyAdmin,
            userController: userController,
            userService: userService,
            selectionService: selectionService,
            file: file,
        }),
    );

    router.get('/', (req, res) => {
        res.send('Welcome!');
    });

    return router;
};
