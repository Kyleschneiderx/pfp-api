const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_favorite_workouts',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            comment: 'see users table',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        workout_id: {
            type: DataTypes.INTEGER,
            comment: 'see workouts table',
            references: {
                model: 'workouts',
                key: 'id',
            },
        },
        is_favorite: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
            name: 'user_favorite_workouts_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'user_favorite_workouts_workout_id',
            using: 'BTREE',
            fields: [{ name: 'workout_id' }],
        },
        {
            name: 'user_favorite_workouts_user_id_workout_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'workout_id' }],
        },
        {
            name: 'user_favorite_workouts_user_id_workout_id_is_favorite',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'workout_id' }, { name: 'is_favorite' }],
        },
    ],
});
