const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'workout_exercises',
    schema: {},
    columns: {
        arrangement: {
            type: DataTypes.INTEGER,
            after: 'hold',
        },
    },
    indexes: [
        {
            name: 'workout_exercises_arrangement',
            using: 'BTREE',
            fields: [{ name: 'arrangement' }],
        },
    ],
});
