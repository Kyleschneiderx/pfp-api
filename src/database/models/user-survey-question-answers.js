export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserSurveyQuestionAnswers',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                comment: 'see users table',
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            question_id: {
                type: DataTypes.INTEGER,
                comment: 'see survey_questions table',
                references: {
                    model: 'survey_questions',
                    key: 'id',
                },
            },
            answer: {
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
            tableName: 'user_survey_question_answers',
            indexes: [
                {
                    name: 'user_survey_question_answers_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_survey_question_answers_question_id',
                    using: 'BTREE',
                    fields: [{ name: 'question_id' }],
                },
                {
                    name: 'user_survey_question_answers_user_id_question_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'question_id' }],
                },
            ],
        },
    );
    return model;
};
