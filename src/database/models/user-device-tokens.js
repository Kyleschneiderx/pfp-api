export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserDeviceTokens',
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
            token: {
                type: DataTypes.TEXT,
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
            tableName: 'user_device_tokens',
            indexes: [
                {
                    name: 'user_device_tokens_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
            ],
        },
    );
    return model;
};
