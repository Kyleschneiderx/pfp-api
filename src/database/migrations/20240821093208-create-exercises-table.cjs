const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'exercises',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(300),
        },
        category_id: {
            type: DataTypes.INTEGER,
            comment: 'see exercise_categories table',
            references: {
                model: 'exercise_categories',
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
        description: {
            type: DataTypes.TEXT,
        },
        how_to: {
            type: DataTypes.TEXT,
        },
        photo: {
            type: DataTypes.STRING(300),
        },
        video: {
            type: DataTypes.STRING(300),
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
            name: 'exercises_name',
            using: 'BTREE',
            fields: [{ name: 'name' }],
        },
        {
            name: 'exercises_category_id',
            using: 'BTREE',
            fields: [{ name: 'category_id' }],
        },
    ],
});
