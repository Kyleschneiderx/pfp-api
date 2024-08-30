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
};

Object.assign(serviceContainer, {
    userService: new services.UserService({ database: serviceContainer.database, logger: serviceContainer.logger }),
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
});

export default serviceContainer;
