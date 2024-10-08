export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'NotificationDescriptions',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            type_id: {
                type: DataTypes.INTEGER,
                comment: 'see notification_types table',
                references: {
                    model: 'notification_types',
                    key: 'id',
                },
            },
            title: {
                type: DataTypes.STRING(255),
            },
            description: {
                type: DataTypes.STRING(255),
            },
        },
        {
            sequelize,
            timestamps: false,
            tableName: 'notification_descriptions',
            indexes: [
                {
                    name: 'notification_descriptions_type_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
            ],
        },
    );
    return model;
};
