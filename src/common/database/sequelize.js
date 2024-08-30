import { Sequelize, DataTypes } from 'sequelize';
import config from '../../configs/sequelize.js';
import * as models from '../../database/models/index.js';

const sequelize = new Sequelize(config.settings);

Object.keys(models).forEach((key) => models[key](sequelize, DataTypes));

Object.keys(sequelize.models).forEach((key) => {
    if (sequelize.models[key].associate !== undefined) {
        sequelize.models[key].associate();
    }
});

export default sequelize;
