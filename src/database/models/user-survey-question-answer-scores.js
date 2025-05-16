export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserSurveyQuestionAnswerScores',
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
            question_group_id: {
                type: DataTypes.INTEGER,
                comment: 'see survey_question_groups table',
            },
            score: {
                type: DataTypes.INTEGER,
            },
            max_score: {
                type: DataTypes.INTEGER,
            },
            final_score: {
                type: DataTypes.DOUBLE(20, 2),
            },
            avg_score: {
                type: DataTypes.DOUBLE(20, 2),
            },
            group_weight: {
                type: DataTypes.DOUBLE(20, 2),
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
            tableName: 'user_survey_question_answer_scores',
            indexes: [
                {
                    name: 'user_survey_question_answer_scores_1',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_survey_question_answer_scores_2',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'question_group_id' }],
                },
            ],
            scopes: {
                withGroup: () => ({
                    include: [
                        {
                            model: sequelize.models.SurveyQuestionGroups,
                            as: 'group',
                            attributes: {
                                exclude: [],
                            },
                            where: {},
                        },
                    ],
                }),
            },
        },
    );
    model.associate = () => {
        const { UserSurveyQuestionAnswerScores, SurveyQuestionGroups } = sequelize.models;

        UserSurveyQuestionAnswerScores.belongsTo(SurveyQuestionGroups, { as: 'group', foreignKey: 'question_group_id' });
    };
    return model;
};
