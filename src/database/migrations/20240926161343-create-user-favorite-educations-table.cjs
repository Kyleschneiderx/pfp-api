const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_favorite_educations',
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
        education_id: {
            type: DataTypes.INTEGER,
            comment: 'see educations table',
            references: {
                model: 'educations',
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
            name: 'user_favorite_educations_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'user_favorite_educations_education_id',
            using: 'BTREE',
            fields: [{ name: 'education_id' }],
        },
        {
            name: 'user_favorite_educations_user_id_education_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'education_id' }],
        },
        {
            name: 'user_favorite_educations_user_id_education_id_is_favorite',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'education_id' }, { name: 'is_favorite' }],
        },
    ],
});
