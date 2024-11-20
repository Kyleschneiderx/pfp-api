const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
    schema: {},
    columns: {
        cancel_at: {
            type: DataTypes.DATE,
            after: 'expires_at',
        },
    },
    indexes: [],
});
