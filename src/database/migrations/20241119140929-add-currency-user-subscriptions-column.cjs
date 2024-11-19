const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
    schema: {},
    columns: {
        currency: {
            type: DataTypes.STRING(10),
            after: 'price',
        },
    },
    indexes: [],
});
