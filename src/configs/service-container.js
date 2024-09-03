import createLogger from '../common/logger/index.js';
import sequelize from '../common/database/sequelize.js';
import * as controllers from '../controllers/index.js';
import * as services from '../services/index.js';
import * as utils from '../utils/index.js';

const serviceContainer = {
    database: sequelize,
    logger: createLogger(),
    apiLogger: createLogger({ type: 'api', console: false }),
    jwt: utils.Jwt,
    password: utils.Password,
    file: utils.File,
};

Object.assign(serviceContainer, {
    smtp: new utils.Smtp(
        {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        { logger: serviceContainer.logger },
    ),
    userService: new services.UserService({ database: serviceContainer.database, logger: serviceContainer.logger }),
    selectionService: new services.SelectionService({ database: serviceContainer.database, logger: serviceContainer.logger }),
    loggerService: new services.LoggerService({ logger: serviceContainer.logger, database: serviceContainer.database }),
});

Object.assign(serviceContainer, {
    authService: new services.AuthService({
        database: serviceContainer.database,
        logger: serviceContainer.logger,
        jwt: serviceContainer.jwt,
        password: serviceContainer.password,
        userService: serviceContainer.userService,
    }),
});

Object.assign(serviceContainer, {
    authController: new controllers.AuthController({
        logger: serviceContainer.logger,
        userService: serviceContainer.userService,
        authService: serviceContainer.authService,
    }),
    userController: new controllers.UserController({ logger: serviceContainer.logger, userService: serviceContainer.userService }),
    selectionController: new controllers.SelectionController({
        logger: serviceContainer.logger,
        selectionService: serviceContainer.selectionService,
    }),
});

export default serviceContainer;
