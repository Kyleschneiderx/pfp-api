export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'SurveyQuestions',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            question: {
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
            tableName: 'survey_questions',
            indexes: [],
        },
    );
    model.associate = () => {
        const { SurveyQuestions, UserSurveyQuestionAnswers } = sequelize.models;

        SurveyQuestions.hasMany(UserSurveyQuestionAnswers, { as: 'user_survey_question_answers', foreignKey: 'question_id' });

        SurveyQuestions.hasOne(UserSurveyQuestionAnswers, { as: 'user_survey_question_answer', foreignKey: 'question_id' });
    };
    return model;
};
