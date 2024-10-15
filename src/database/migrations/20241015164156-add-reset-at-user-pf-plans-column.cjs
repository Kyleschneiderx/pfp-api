const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_pf_plans',
    schema: {},
    columns: {
        reset_at: {
            type: DataTypes.DATE,
            after: 'pf_plan_id',
        },
    },
    indexes: [],
});
