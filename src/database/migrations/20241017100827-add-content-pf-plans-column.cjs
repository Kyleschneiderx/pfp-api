const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plans',
    schema: {},
    columns: {
        content: {
            type: DataTypes.TEXT('long'),
            after: 'description',
        },
    },
    indexes: [],
});
