import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import routeV1Auth from './v1/auth.js';
import routeV1Users from './v1/users.js';
import * as middlewares from '../middlewares/index.js';

export default ({ logger, apiLogger, jwt, authController, userController, userService }) => {
    const router = express.Router();

    router.use(helmet());

    router.use(cors());

    router.use(compression());

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
        '/v1/auth',
        routeV1Auth({
            authController: authController,
        }),
    );

    router.use(middlewares.verifyAuth({ jwt: jwt }));

    router.use(
        '/v1/users',
        routeV1Users({
            verifyAdmin: middlewares.verifyAdmin,
            userController: userController,
            userService: userService,
        }),
    );

    router.get('/', (req, res) => {
        res.send('Welcome!');
    });

    return router;
};
