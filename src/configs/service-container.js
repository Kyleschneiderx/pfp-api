import createLogger from '../common/logger/index.js';
import sequelize from '../common/database/sequelize.js';
import firebase from '../common/firebase/index.js';
import s3Client, { s3 } from '../common/aws-s3/index.js';
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
            [process.env.SMTP_TYPE]: configSmtp[process.env.SMTP_TYPE],
        },
        { logger: logger },
    ),
    storage: new utils.Storage({ driver: s3Client, logger: logger, file: utils.File, s3: s3 }),
    helper: utils.Helper,
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
        storage: serviceContainer.storage,
        file: serviceContainer.file,
        helper: serviceContainer.helper,
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
    exerciseService: new services.ExerciseService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        storage: serviceContainer.storage,
        helper: serviceContainer.helper,
    }),
    workoutService: new services.WorkoutService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        storage: serviceContainer.storage,
    }),
    pfPlanService: new services.PfPlanService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        storage: serviceContainer.storage,
    }),
    educationService: new services.EducationService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        storage: serviceContainer.storage,
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
        authService: serviceContainer.authService,
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
        verificationService: serviceContainer.verificationService,
    }),
    exerciseController: new controllers.ExerciseController({
        logger: serviceContainer.logger,
        exerciseService: serviceContainer.exerciseService,
    }),
    workoutController: new controllers.WorkoutController({
        logger: serviceContainer.logger,
        workoutService: serviceContainer.workoutService,
        userService: serviceContainer.userService,
    }),
    pfPlanController: new controllers.PfPlanController({
        logger: serviceContainer.logger,
        pfPlanService: serviceContainer.pfPlanService,
        userService: serviceContainer.userService,
    }),
    educationController: new controllers.EducationController({
        logger: serviceContainer.logger,
        educationService: serviceContainer.educationService,
        userService: serviceContainer.userService,
    }),
});

export default serviceContainer;
