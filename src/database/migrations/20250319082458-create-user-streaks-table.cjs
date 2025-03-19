const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_streaks',
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
        current_streak: {
            type: DataTypes.INTEGER,
        },
        longest_streak: {
            type: DataTypes.INTEGER,
        },
        last_streak_date: {
            type: DataTypes.DATEONLY,
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
            name: 'user_streaks_1',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'user_streaks_2',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'last_streak_date' }],
        },
    ],
});
