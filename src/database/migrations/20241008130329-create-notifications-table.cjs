const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'notifications',
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
        description_id: {
            type: DataTypes.INTEGER,
            comment: 'see notification_descriptions table',
            references: {
                model: 'notification_descriptions',
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
            name: 'notifications_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'notifications_description_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'notifications_user_id_description_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'description_id' }],
        },
    ],
});
