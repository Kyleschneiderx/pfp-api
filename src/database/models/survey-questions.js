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
    return model;
};
