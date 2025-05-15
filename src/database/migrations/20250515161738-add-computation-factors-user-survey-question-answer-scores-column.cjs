const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_survey_question_answer_scores',
    schema: {},
    columns: {
        final_score: {
            type: DataTypes.DOUBLE(20, 2),
            after: 'score',
        },
        avg_score: {
            type: DataTypes.DOUBLE(20, 2),
            after: 'final_score',
        },
        group_weight: {
            type: DataTypes.DOUBLE(20, 2),
            after: 'avg_score',
        },
    },
    indexes: [],
});
