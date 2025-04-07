export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'SurveyQuestionGroups',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            value: {
                type: DataTypes.STRING(100),
            },
            description: {
                type: DataTypes.STRING(100),
            },
        },
        {
            sequelize,
            timestamps: false,
            tableName: 'survey_question_groups',
            indexes: [],
        },
    );
    model.associate = () => {
        const { SurveyQuestionGroups, ContentCategories } = sequelize.models;

        SurveyQuestionGroups.hasMany(ContentCategories, { as: 'content_categories', foreignKey: 'category_id' });
    };

    return model;
};
