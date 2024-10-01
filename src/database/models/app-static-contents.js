export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'AppStaticContents',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            key: {
                type: DataTypes.STRING(50),
            },
            content: {
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
            timestamps: false,
            tableName: 'app_static_contents',
            indexes: [
                {
                    name: 'app_static_contents_key',
                    using: 'BTREE',
                    fields: [{ name: 'key' }],
                },
            ],
        },
    );
    return model;
};
