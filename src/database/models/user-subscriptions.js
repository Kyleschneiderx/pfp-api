export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserSubscriptions',
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
            package_id: {
                type: DataTypes.INTEGER,
                comment: 'see subscription_packages table',
                references: {
                    model: 'subscription_packages',
                    key: 'id',
                },
            },
            price: {
                type: DataTypes.DOUBLE(20, 2),
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
            tableName: 'user_subscriptions',
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
                    name: 'user_subscriptions_user_id_package_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'package_id' }],
                },
            ],
        },
    );
    return model;
};
