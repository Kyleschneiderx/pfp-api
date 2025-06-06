const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_profiles',
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
        name: {
            type: DataTypes.STRING(300),
        },
        contact_number: {
            type: DataTypes.STRING(50),
        },
        birthdate: {
            type: DataTypes.DATEONLY,
        },
        description: {
            type: DataTypes.TEXT,
        },
        photo: {
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
            name: 'user_profiles_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
    ],
});
