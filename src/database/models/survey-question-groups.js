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

    return model;
};
