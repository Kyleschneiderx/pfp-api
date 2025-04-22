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
            tableName: 'survey_question_groups',
            indexes: [],
        },
    );
    model.associate = () => {
        const { SurveyQuestionGroups, ContentCategories, SurveyQuestionGroupIds, SurveyQuestions } = sequelize.models;

        SurveyQuestionGroups.hasMany(ContentCategories, { as: 'content_categories', foreignKey: 'category_id' });

        SurveyQuestionGroups.hasMany(SurveyQuestionGroupIds, { as: 'question_ids', foreignKey: 'group_id' });

        SurveyQuestionGroups.belongsToMany(SurveyQuestions, {
            as: 'questions',
            through: {
                model: SurveyQuestionGroupIds,
                as: 'question_ids',
            },
            foreignKey: 'group_id',
            otherKey: 'question_id',
        });
    };

    return model;
};
