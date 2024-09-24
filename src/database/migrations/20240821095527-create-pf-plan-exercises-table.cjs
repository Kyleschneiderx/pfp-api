const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plan_exercises',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        pf_plan_id: {
            type: DataTypes.INTEGER,
            comment: 'see pf_plans table',
            references: {
                model: 'pf_plans',
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
            name: 'pf_plan_exercises_pf_plan_id',
            using: 'BTREE',
            fields: [{ name: 'pf_plan_id' }],
        },
        {
            name: 'pf_plan_exercises_pf_plan_id_exercise_id',
            using: 'BTREE',
            fields: [{ name: 'pf_plan_id' }, { name: 'exercise_id' }],
        },
        {
            name: 'pf_plan_exercises_pf_plan_id_exercise_id_day',
            using: 'BTREE',
            fields: [{ name: 'pf_plan_id' }, { name: 'exercise_id' }, { name: 'day' }],
        },
    ],
});
