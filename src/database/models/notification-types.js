export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'NotificationTypes',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            value: {
                type: DataTypes.STRING(50),
            },
        },
        {
            sequelize,
            timestamps: false,
            tableName: 'notification_types',
            indexes: [],
        },
    );
    return model;
};
