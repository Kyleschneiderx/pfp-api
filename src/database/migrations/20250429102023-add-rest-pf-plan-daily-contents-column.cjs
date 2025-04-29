const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plan_daily_contents',
    schema: {},
    columns: {
        rest: {
            type: DataTypes.INTEGER,
            after: 'hold',
        },
    },
    indexes: [],
});
