export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'RevenuecatWebhooks',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            data: {
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
        {
            sequelize,
            tableName: 'revenuecat_webhooks',
            indexes: [],
        },
    );

    return model;
};
