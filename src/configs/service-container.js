import createLogger from '../common/logger/index.js';
import sequelize from '../common/database/sequelize.js';
import firebase from '../common/firebase/index.js';
import appleAppStore, { appleAppStoreServerLib } from '../common/apple-app-store/index.js';
import googleAuthClient, { googleApis } from '../common/googleapis/index.js';
import s3Client, { s3, s3PreSigner } from '../common/aws-s3/index.js';
import revenuecat from '../common/revenuecat/index.js';
import { openAiChat } from '../common/open-router/index.js';
import facebookPixel from '../common/facebook-business/index.js';
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
    ssoAuthentication: firebase.auth(),
    pushNotification: firebase.messaging(),
    inAppPurchase: new utils.InAppPurchase({
        logger: logger,
        apple: {
            appleAppStoreClient: appleAppStore,
            appleAppStoreServerLib: appleAppStoreServerLib,
        },
        google: {
            googleAuthClient: googleAuthClient,
            googleApis: googleApis,
        },
    }),
    smtp: new utils.Smtp(
        {
            [process.env.SMTP_TYPE]: configSmtp[process.env.SMTP_TYPE],
        },
        { logger: logger },
    ),
    storage: new utils.Storage({ driver: s3Client, logger: logger, file: utils.File, s3: s3, s3PreSigner: s3PreSigner }),
    helper: utils.Helper,
    scheduler: new utils.Scheduler({ logger: logger }),
    revenuecat: revenuecat,
    openAiChat: openAiChat,
    facebookPixel: facebookPixel,
};

Object.assign(serviceContainer, {
    selectionService: new services.SelectionService({ database: serviceContainer.database, logger: serviceContainer.logger }),
    loggerService: new services.LoggerService({ logger: serviceContainer.logger, database: serviceContainer.database }),
    emailService: new services.EmailService({
        logger: serviceContainer.logger,
        smtp: serviceContainer.smtp,
        file: serviceContainer.file,
        helper: serviceContainer.helper,
        facebookPixel: serviceContainer.facebookPixel,
    }),
    notificationService: new services.NotificationService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        pushNotification: serviceContainer.pushNotification,
    }),
    streakService: new services.StreakService({
        logger: serviceContainer.logger,
        helper: serviceContainer.helper,
        database: serviceContainer.database,
    }),
});

Object.assign(serviceContainer, {
    userService: new services.UserService({
        database: serviceContainer.database,
        logger: serviceContainer.logger,
        password: serviceContainer.password,
        storage: serviceContainer.storage,
        file: serviceContainer.file,
        helper: serviceContainer.helper,
        notificationService: serviceContainer.notificationService,
        inAppPurchase: serviceContainer.inAppPurchase,
        facebookPixel: serviceContainer.facebookPixel,
    }),
    authService: new services.AuthService({
        database: serviceContainer.database,
        logger: serviceContainer.logger,
        jwt: serviceContainer.jwt,
        password: serviceContainer.password,
        userService: serviceContainer.userService,
        ssoAuthentication: serviceContainer.ssoAuthentication,
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
        file: serviceContainer.file,
    }),
    workoutService: new services.WorkoutService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        storage: serviceContainer.storage,
        notificationService: serviceContainer.notificationService,
        file: serviceContainer.file,
    }),
    pfPlanService: new services.PfPlanService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        storage: serviceContainer.storage,
        notificationService: serviceContainer.notificationService,
        streakService: serviceContainer.streakService,
        file: serviceContainer.file,
    }),
    educationService: new services.EducationService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        helper: serviceContainer.helper,
        storage: serviceContainer.storage,
        notificationService: serviceContainer.notificationService,
        file: serviceContainer.file,
    }),
    miscellaneousService: new services.MiscellaneousService({
        logger: serviceContainer.logger,
        database: serviceContainer.database,
        inAppPurchase: serviceContainer.inAppPurchase,
        revenuecat: serviceContainer.revenuecat,
        facebookPixel: serviceContainer.facebookPixel,
        helper: serviceContainer.helper,
    }),
});

Object.assign(serviceContainer, {
    authController: new controllers.AuthController({
        logger: serviceContainer.logger,
        userService: serviceContainer.userService,
        authService: serviceContainer.authService,
        notificationService: serviceContainer.notificationService,
        loggerService: serviceContainer.loggerService,
    }),
    userController: new controllers.UserController({
        logger: serviceContainer.logger,
        userService: serviceContainer.userService,
        verificationService: serviceContainer.verificationService,
        authService: serviceContainer.authService,
        pfPlanService: serviceContainer.pfPlanService,
        miscellaneousService: serviceContainer.miscellaneousService,
        notificationService: serviceContainer.notificationService,
        emailService: serviceContainer.emailService,
        loggerService: serviceContainer.loggerService,
        streakService: serviceContainer.streakService,
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
        loggerService: serviceContainer.loggerService,
    }),
    exerciseController: new controllers.ExerciseController({
        logger: serviceContainer.logger,
        exerciseService: serviceContainer.exerciseService,
        loggerService: serviceContainer.loggerService,
    }),
    workoutController: new controllers.WorkoutController({
        logger: serviceContainer.logger,
        workoutService: serviceContainer.workoutService,
        userService: serviceContainer.userService,
        loggerService: serviceContainer.loggerService,
    }),
    pfPlanController: new controllers.PfPlanController({
        logger: serviceContainer.logger,
        pfPlanService: serviceContainer.pfPlanService,
        userService: serviceContainer.userService,
        loggerService: serviceContainer.loggerService,
    }),
    educationController: new controllers.EducationController({
        logger: serviceContainer.logger,
        educationService: serviceContainer.educationService,
        userService: serviceContainer.userService,
        loggerService: serviceContainer.loggerService,
    }),
    miscellaneousController: new controllers.MiscellaneousController({
        logger: serviceContainer.logger,
        miscellaneousService: serviceContainer.miscellaneousService,
        loggerService: serviceContainer.loggerService,
        emailService: serviceContainer.emailService,
        userService: serviceContainer.userService,
    }),
    notificationController: new controllers.NotificationController({
        logger: serviceContainer.logger,
        notificationService: serviceContainer.notificationService,
    }),
});

export default serviceContainer;
