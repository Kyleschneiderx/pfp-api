const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'workout_exercises',
    schema: {},
    columns: {
        rest: {
            type: DataTypes.INTEGER,
            after: 'hold',
        },
    },
    indexes: [],
});
