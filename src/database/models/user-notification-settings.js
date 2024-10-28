export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserNotificationSettings',
        {
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
            is_enable: {
                type: DataTypes.BOOLEAN,
            },
            time: {
                type: DataTypes.TIME,
            },
            time_utc: {
                type: DataTypes.TIME,
            },
            timezone: {
                type: DataTypes.STRING(100),
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
        {
            sequelize,
            tableName: 'user_notification_settings',
            indexes: [
                {
                    name: 'user_notification_settings_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_notification_settings_is_enable',
                    using: 'BTREE',
                    fields: [{ name: 'is_enable' }],
                },
                {
                    name: 'user_notification_settings_time',
                    using: 'BTREE',
                    fields: [{ name: 'time' }],
                },
                {
                    name: 'user_notification_settings_time_utc',
                    using: 'BTREE',
                    fields: [{ name: 'time_utc' }],
                },
            ],
        },
    );
    return model;
};
