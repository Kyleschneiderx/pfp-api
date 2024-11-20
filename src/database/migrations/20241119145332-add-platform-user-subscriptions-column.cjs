const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
    schema: {},
    columns: {
        platform: {
            type: DataTypes.STRING(100),
            after: 'status',
        },
    },
    indexes: [
        {
            name: 'user_subscriptions_platform',
            using: 'BTREE',
            fields: [{ name: 'platform' }],
        },
    ],
});
