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
            group_id: {
                type: DataTypes.INTEGER,
                comment: 'see survey_question_groups table',
                references: {
                    model: 'survey_question_groups',
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
            tableName: 'survey_questions',
            indexes: [
                {
                    name: 'survey_questions_group_id',
                    using: 'BTREE',
                    fields: [{ name: 'group_id' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { SurveyQuestions, UserSurveyQuestionAnswers, SurveyQuestionGroups, SurveyQuestionGroupIds } = sequelize.models;

        SurveyQuestions.hasMany(UserSurveyQuestionAnswers, { as: 'user_survey_question_answers', foreignKey: 'question_id' });

        SurveyQuestions.hasOne(UserSurveyQuestionAnswers, { as: 'user_survey_question_answer', foreignKey: 'question_id' });

        SurveyQuestions.belongsTo(SurveyQuestionGroups, { as: 'survey_question_group', foreignKey: 'group_id' });

        SurveyQuestions.hasMany(SurveyQuestionGroupIds, { as: 'group_ids', foreignKey: 'question_id' });

        SurveyQuestions.belongsToMany(SurveyQuestionGroups, {
            as: 'groups',
            through: {
                model: SurveyQuestionGroupIds,
                as: 'group_ids',
            },
            foreignKey: 'question_id',
            otherKey: 'group_id',
        });
    };
    return model;
};
