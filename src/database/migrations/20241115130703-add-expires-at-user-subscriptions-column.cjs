const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
    schema: {},
    columns: {
        expires_at: {
            type: DataTypes.DATEONLY,
            after: 'response',
        },
    },
    indexes: [
        {
            name: 'user_subscriptions_expires_at',
            using: 'BTREE',
            fields: [{ name: 'expires_at' }],
        },
    ],
});
