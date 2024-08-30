export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'Educations',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING(300),
            },
            content: {
                type: DataTypes.TEXT,
            },
            video_url: {
                type: DataTypes.STRING(300),
            },
            video_upload: {
                type: DataTypes.STRING(300),
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
            tableName: 'educations',
            indexes: [
                {
                    name: 'educations_title',
                    using: 'BTREE',
                    fields: [{ name: 'title' }],
                },
            ],
        },
    );
    return model;
};
