const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
    schema: {},
    columns: {
        trial_started_at: {
            type: DataTypes.DATE,
            after: 'cancel_at',
        },
    },
    indexes: [],
});
