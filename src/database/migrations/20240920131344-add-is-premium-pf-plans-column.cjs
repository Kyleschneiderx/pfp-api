const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plans',
    schema: {},
    columns: {
        is_premium: {
            type: DataTypes.BOOLEAN,
            after: 'description',
        },
    },
    indexes: [
        {
            name: 'pf_plans_is_premium',
            using: 'BTREE',
            fields: [{ name: 'is_premium' }],
        },
        {
            name: 'pf_plans_status_id_is_premium',
            using: 'BTREE',
            fields: [{ name: 'status_id' }, { name: 'is_premium' }],
        },
    ],
});
