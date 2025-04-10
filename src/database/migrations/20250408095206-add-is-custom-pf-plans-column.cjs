const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plans',
    schema: {},
    columns: {
        is_custom: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            after: 'is_premium',
        },
    },
    indexes: [
        {
            name: 'pf_plans_is_custom',
            using: 'BTREE',
            fields: [{ name: 'is_custom' }],
        },
    ],
});
