const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'reset_password_requests',
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
        reference: {
            type: DataTypes.STRING(500),
        },
        status_id: {
            type: DataTypes.INTEGER,
            comment: 'see statuses table',
            references: {
                model: 'statuses',
                key: 'id',
            },
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
            name: 'reset_password_requests_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'reset_password_requests_reference',
            using: 'BTREE',
            fields: [{ name: 'reference' }],
        },
        {
            name: 'reset_password_requests_user_id_reference',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'reference' }],
        },
        {
            name: 'reset_password_requests_status_id',
            using: 'BTREE',
            fields: [{ name: 'status_id' }],
        },
        {
            name: 'reset_password_requests_user_id_reference_status_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'reference' }, { name: 'status_id' }],
        },
    ],
});
