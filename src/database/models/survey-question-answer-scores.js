export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'SurveyQuestionAnswerScores',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            key: {
                type: DataTypes.STRING(100),
            },
            score: {
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            timestamps: false,
            tableName: 'survey_question_answer_scores',
            indexes: [
                {
                    name: 'survey_question_answer_scores_1',
                    using: 'BTREE',
                    fields: [{ name: 'key' }],
                },
            ],
        },
    );
    return model;
};
