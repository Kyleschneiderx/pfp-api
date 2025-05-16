const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_survey_question_answer_scores',
    schema: {},
    columns: {
        max_score: {
            type: DataTypes.INTEGER,
            after: 'score',
        },
    },
    indexes: [],
});
