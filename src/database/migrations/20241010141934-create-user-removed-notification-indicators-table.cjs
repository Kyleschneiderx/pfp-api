const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_removed_notification_indicators',
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
        notification_id: {
            type: DataTypes.INTEGER,
            comment: 'last notification id available before removal; see notifications table',
            references: {
                model: 'notifications',
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
            name: 'user_removed_notification_indicators_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'user_removed_notification_indicators_notification_id',
            using: 'BTREE',
            fields: [{ name: 'notification_id' }],
        },
        {
            name: 'user_removed_notification_indicators_user_id_notification_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'notification_id' }],
        },
    ],
});
