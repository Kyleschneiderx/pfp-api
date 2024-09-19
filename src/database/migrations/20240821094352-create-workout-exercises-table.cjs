const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'workout_exercises',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        workout_id: {
            type: DataTypes.INTEGER,
            comment: 'see workouts table',
            references: {
                model: 'workouts',
                key: 'id',
            },
        },
        exercise_id: {
            type: DataTypes.INTEGER,
            comment: 'see exercises table',
            references: {
                model: 'exercises',
                key: 'id',
            },
        },
        sets: {
            type: DataTypes.INTEGER,
        },
        reps: {
            type: DataTypes.INTEGER,
        },
        hold: {
            comment: 'in seconds',
            type: DataTypes.INTEGER,
        },
        created_at: {
            type: DataTypes.DATE,
        },
        updated_at: {
            type: DataTypes.DATE,
        },
        deleted_at: {
            type: DataTypes.DATE,
        },
    },
    columns: {},
    indexes: [
        {
            name: 'workout_exercises_workout_id',
            using: 'BTREE',
            fields: [{ name: 'workout_id' }],
        },
        {
            name: 'workout_exercises_workout_id_exercise_id',
            using: 'BTREE',
            fields: [{ name: 'workout_id' }, { name: 'exercise_id' }],
        },
    ],
});
