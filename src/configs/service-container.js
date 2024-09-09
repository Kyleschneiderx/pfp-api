import createLogger from '../common/logger/index.js';
import sequelize from '../common/database/sequelize.js';
import firebase from '../common/firebase/index.js';
import * as controllers from '../controllers/index.js';
import * as services from '../services/index.js';
import * as utils from '../utils/index.js';
import configSmtp from './smtp.js';

const logger = createLogger();

const serviceContainer = {
    database: sequelize,
    logger: logger,
    apiLogger: createLogger({ type: 'api', console: false }),
    jwt: utils.Jwt,
    password: utils.Password,
    file: utils.File,
    firebase: firebase,
    smtp: new utils.Smtp(
        {
            host: configSmtp.host,
            port: configSmtp.port,
            secure: configSmtp.secure,
            user: configSmtp.user,
            pass: configSmtp.pass,
        },
        { logger: logger },
    ),
};

Object.assign(serviceContainer, {
    selectionService: new services.SelectionService({ database: serviceContainer.database, logger: serviceContainer.logger }),
    loggerService: new services.LoggerService({ logger: serviceContainer.logger, database: serviceContainer.database }),
    emailService: new services.EmailService({ logger: serviceContainer.logger, smtp: serviceContainer.smtp, file: serviceContainer.file }),
});

Object.assign(serviceContainer, {
    userService: new services.UserService({
        database: serviceContainer.database,
        logger: serviceContainer.logger,
        password: serviceContainer.password,
    }),
    authService: new services.AuthService({
        database: serviceContainer.database,
        logger: serviceContainer.logger,
        jwt: serviceContainer.jwt,
        password: serviceContainer.password,
        userService: serviceContainer.userService,
        firebase: serviceContainer.firebase,
    }),
    verificationService: new services.VerificationService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        smtp: serviceContainer.smtp,
        jwt: serviceContainer.jwt,
        file: serviceContainer.file,
        emailService: serviceContainer.emailService,
    }),
});

Object.assign(serviceContainer, {
    authController: new controllers.AuthController({
        logger: serviceContainer.logger,
        userService: serviceContainer.userService,
        authService: serviceContainer.authService,
    }),
    userController: new controllers.UserController({
        logger: serviceContainer.logger,
        userService: serviceContainer.userService,
        verificationService: serviceContainer.verificationService,
    }),
    selectionController: new controllers.SelectionController({
        logger: serviceContainer.logger,
        selectionService: serviceContainer.selectionService,
    }),
    verificationController: new controllers.VerificationController({
        logger: serviceContainer.logger,
        verificationService: serviceContainer.verificationService,
        userService: serviceContainer.userService,
    }),
    forgotPasswordController: new controllers.ForgotPasswordController({
        logger: serviceContainer.logger,
        authService: serviceContainer.authService,
        userService: serviceContainer.userService,
        emailService: serviceContainer.emailService,
    }),
});

export default serviceContainer;
