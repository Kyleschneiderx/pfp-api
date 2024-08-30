/* eslint-disable no-use-before-define */
import 'dotenv/config';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import compression from 'compression';
import errorHandler from './middlewares/error-handler.js';
import apiRoute from './routes/api.js';
import serviceContainer from './configs/service-container.js';

const app = express();

app.use(
    cors({
        origin: ['http://localhost'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        optionsSuccessStatus: 200,
    }),
);

app.use(helmet());

app.use(compression());

app.use(
    '/api',
    apiRoute({
        logger: serviceContainer.logger,
        apiLogger: serviceContainer.apiLogger,
        jwt: serviceContainer.jwt,
        authController: serviceContainer.authController,
        userController: serviceContainer.userController,
        userService: serviceContainer.userService,
    }),
);

app.use(errorHandler);

app.listen(process.env.APP_PORT, () => {
    serviceContainer.logger.info(`App is running at: ${process.env.APP_URL}:${process.env.APP_PORT}`);
});
