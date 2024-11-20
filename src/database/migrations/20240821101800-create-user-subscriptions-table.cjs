const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_subscriptions',
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
            type: DataTypes.STRING(100),
        },
        package_id: {
            type: DataTypes.STRING(100),
        },
        price: {
            type: DataTypes.DOUBLE(20, 2),
        },
        status: {
            type: DataTypes.STRING(20),
        },
        response: {
            type: DataTypes.TEXT('long'),
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
            name: 'user_subscriptions_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'user_subscriptions_package_id',
            using: 'BTREE',
            fields: [{ name: 'package_id' }],
        },
        {
            name: 'user_subscriptions_reference',
            using: 'BTREE',
            fields: [{ name: 'reference' }],
        },
        {
            name: 'user_subscriptions_status',
            using: 'BTREE',
            fields: [{ name: 'status' }],
        },
        {
            name: 'user_subscriptions_user_id_package_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'package_id' }],
        },
        {
            name: 'user_subscriptions_user_id_reference',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'reference' }],
        },
        {
            name: 'user_subscriptions_user_id_status',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'status' }],
        },
    ],
});
