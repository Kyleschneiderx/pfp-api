export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'SubscriptionPackages',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
            },
            description: {
                type: DataTypes.TEXT,
            },
            price: {
                type: DataTypes.DOUBLE(20, 2),
            },
            discounted_price: {
                type: DataTypes.DOUBLE(20, 2),
            },
            is_recommended: {
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
            tableName: 'subscription_packages',
            indexes: [
                {
                    name: 'subscription_packages_is_recommended',
                    using: 'BTREE',
                    fields: [{ name: 'is_recommended' }],
                },
            ],
        },
    );
    return model;
};
