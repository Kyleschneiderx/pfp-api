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
            reference: {
                type: DataTypes.STRING(100),
            },
            original_reference: {
                type: DataTypes.STRING(150),
            },
            package_id: {
                type: DataTypes.STRING(150),
            },
            price: {
                type: DataTypes.DOUBLE(20, 2),
            },
            currency: {
                type: DataTypes.STRING(10),
                after: 'price',
            },
            status: {
                type: DataTypes.STRING(20),
            },
            platform: {
                type: DataTypes.STRING(100),
            },
            response: {
                type: DataTypes.TEXT('long'),
            },
            expires_at: {
                type: DataTypes.DATE,
            },
            cancel_at: {
                type: DataTypes.DATE,
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
                {
                    name: 'user_subscriptions_expires_at',
                    using: 'BTREE',
                    fields: [{ name: 'expires_at' }],
                },
            ],
        },
    );
    return model;
};
