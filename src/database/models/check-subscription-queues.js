export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'CheckSubscriptionQueues',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            subscriptions: {
                type: DataTypes.TEXT('long'),
            },
            platform: {
                type: DataTypes.STRING(50),
            },
            is_pending: {
                type: DataTypes.BOOLEAN,
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
            tableName: 'check_subscription_queues',
            indexes: [
                {
                    name: 'check_subscription_queues_platform',
                    using: 'BTREE',
                    fields: [{ name: 'platform' }],
                },
                {
                    name: 'check_subscription_queues_is_pending',
                    using: 'BTREE',
                    fields: [{ name: 'is_pending' }],
                },
                {
                    name: 'check_subscription_queues_platform_is_pending',
                    using: 'BTREE',
                    fields: [{ name: 'platform' }, { name: 'is_pending' }],
                },
            ],
        },
    );
    return model;
};
