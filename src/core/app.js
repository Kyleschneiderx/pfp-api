/* eslint-disable no-use-before-define */
import 'express-async-errors';
import cors from 'cors';
import * as fs from 'fs';
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

    app.use('/api', apiRoute(serviceContainer));

    app.use(errorHandler({ logger: serviceContainer.logger }));

    app.get('/chat-demo', (req, res) => {
        const contents = fs.readFileSync('./src/templates/chat-demo.html', { encoding: 'utf8' });

        res.send(contents);
    });

    app.get('/', (req, res) => {
        res.send('Hello');
    });

    return app;
};
