const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'workouts',
    schema: {},
    columns: {
        photo: {
            type: DataTypes.STRING(300),
            after: 'description',
        },
    },
    indexes: [],
});
