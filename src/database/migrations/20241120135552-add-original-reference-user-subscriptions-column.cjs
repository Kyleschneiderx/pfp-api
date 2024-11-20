const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
    schema: {},
    columns: {
        original_reference: {
            type: DataTypes.STRING(150),
            after: 'reference',
        },
    },
    indexes: [],
});
