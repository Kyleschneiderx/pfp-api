const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plan_daily_contents',
    schema: {},
    columns: {
        arrangement: {
            type: DataTypes.INTEGER,
            after: 'education_id',
        },
    },
    indexes: [
        {
            name: 'pf_plan_daily_contents_arrangement',
            using: 'BTREE',
            fields: [{ name: 'arrangement' }],
        },
    ],
});
