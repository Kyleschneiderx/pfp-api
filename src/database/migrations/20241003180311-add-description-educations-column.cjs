const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'educations',
    schema: {},
    columns: {
        description: {
            type: DataTypes.STRING(100),
            after: 'title',
        },
    },
    indexes: [],
});
