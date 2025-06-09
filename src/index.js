/* eslint-disable no-use-before-define */
import 'dotenv/config';
import 'express-async-errors';
import path from 'path';
import { fileURLToPath } from 'url';
import serviceContainer from './core/service-container.js';
import tasks from './tasks/index.js';
import app from './core/app.js';

global.__dirname = path.dirname(fileURLToPath(import.meta.url));

const server = app({
    serviceContainer,
});

server.listen(process.env.APP_PORT, () => {
    serviceContainer.scheduler.run(
        tasks({
            logger: serviceContainer.logger,
            userService: serviceContainer.userService,
            pfPlanService: serviceContainer.pfPlanService,
            notificationService: serviceContainer.notificationService,
            miscellaneousService: serviceContainer.miscellaneousService,
            database: serviceContainer.database,
            storage: serviceContainer.storage,
            file: serviceContainer.file,
        }),
    );

    serviceContainer.logger.info(`App is running at: ${process.env.APP_URL}`);
});
