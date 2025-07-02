/* eslint-disable no-use-before-define */
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import express from 'express';
import compression from 'compression';
import errorHandler from '../middlewares/error-handler.js';
import apiRoute from '../routes/api.js';
import webhookRoute from '../routes/webhook.js';

export default ({ serviceContainer }) => {
    const app = express();

    app.use(
        cors({
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            optionsSuccessStatus: 200,
        }),
    );

    app.use(
        helmet({
            ...(process.env.APP_ENV !== 'production'
                ? {
                      strictTransportSecurity: false,
                      contentSecurityPolicy: false,
                  }
                : {}),
            crossOriginResourcePolicy: {
                policy: 'cross-origin',
            },
        }),
    );

    app.use(compression());

    app.use(
        fileUpload({
            limits: { fieldSize: 1100 * 1024 * 1024 },
        }),
    );

    app.use(
        express.json({
            limit: '100mb',
        }),
    );

    app.use(
        express.urlencoded({
            extended: true,
            limit: '100mb',
        }),
    );

    app.use(
        '/webhook',
        webhookRoute({
            miscellaneousController: serviceContainer.miscellaneousController,
        }),
    );

    app.use(
        '/api',
        apiRoute({
            logger: serviceContainer.logger,
            apiLogger: serviceContainer.apiLogger,
            jwt: serviceContainer.jwt,
            file: serviceContainer.file,
            smtp: serviceContainer.smtp,
            password: serviceContainer.password,
            authController: serviceContainer.authController,
            userController: serviceContainer.userController,
            userService: serviceContainer.userService,
            selectionController: serviceContainer.selectionController,
            selectionService: serviceContainer.selectionService,
            loggerService: serviceContainer.loggerService,
            authService: serviceContainer.authService,
            verificationController: serviceContainer.verificationController,
            verificationService: serviceContainer.verificationService,
            forgotPasswordController: serviceContainer.forgotPasswordController,
            exerciseController: serviceContainer.exerciseController,
            exerciseService: serviceContainer.exerciseService,
            helper: serviceContainer.helper,
            workoutController: serviceContainer.workoutController,
            workoutService: serviceContainer.workoutService,
            pfPlanController: serviceContainer.pfPlanController,
            pfPlanService: serviceContainer.pfPlanService,
            educationController: serviceContainer.educationController,
            educationService: serviceContainer.educationService,
            miscellaneousController: serviceContainer.miscellaneousController,
            miscellaneousService: serviceContainer.miscellaneousService,
            notificationController: serviceContainer.notificationController,
            inAppPurchase: serviceContainer.inAppPurchase,
            storage: serviceContainer.storage,
            revenuecat: serviceContainer.revenuecat,
            fireStore: serviceContainer.fireStore,
            database: serviceContainer.database,
        }),
    );

    app.use(errorHandler({ logger: serviceContainer.logger }));

    app.get('/', (req, res) => {
        res.send('Hello');
    });

    return app;
};
