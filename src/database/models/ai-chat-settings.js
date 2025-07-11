export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'AiChatSettings',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            key: {
                type: DataTypes.STRING(50),
            },
            value: {
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
            tableName: 'ai_chat_settings',
            indexes: [],
        },
    );
    return model;
};
