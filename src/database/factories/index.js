import users from './users.js';
import sequelize from '../../common/database/sequelize.js';

export const userFactory = users({ ...sequelize.models });
