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
            photo: {
                type: DataTypes.STRING(300),
            },
            media_url: {
                type: DataTypes.STRING(300),
            },
            media_upload: {
                type: DataTypes.STRING(300),
            },
            status_id: {
                type: DataTypes.INTEGER,
                comment: 'see statuses table',
                references: {
                    model: 'statuses',
                    key: 'id',
                },
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
                {
                    name: 'educations_status_id',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { Educations, Statuses, UserFavoriteEducations } = sequelize.models;

        Educations.belongsTo(Statuses, { as: 'status', foreignKey: 'status_id' });

        Educations.hasMany(UserFavoriteEducations, { as: 'user_favorite_educations', foreignKey: 'education_id' });
    };
    return model;
};
