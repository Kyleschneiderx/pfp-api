/* eslint-disable no-use-before-define */
import 'dotenv/config';
import 'express-async-errors';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import compression from 'compression';
import errorHandler from './middlewares/error-handler.js';
import apiRoute from './routes/api.js';
import serviceContainer from './configs/service-container.js';
import tasks from './tasks/index.js';

global.__dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
    cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        optionsSuccessStatus: 200,
    }),
);

app.use(
    helmet(
        process.env.APP_ENV !== 'production'
            ? {
                  strictTransportSecurity: false,
                  contentSecurityPolicy: false,
              }
            : {},
    ),
);

app.use(compression());

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
    }),
);

app.use(errorHandler({ logger: serviceContainer.logger }));

app.get('/', (req, res) => {
    res.send('Hello');
});

app.listen(process.env.APP_PORT, () => {
    serviceContainer.scheduler.run(
        tasks({
            logger: serviceContainer.logger,
            userService: serviceContainer.userService,
            pfPlanService: serviceContainer.pfPlanService,
            notificationService: serviceContainer.notificationService,
        }),
    );

    serviceContainer.logger.info(`App is running at: ${process.env.APP_URL}`);
});
