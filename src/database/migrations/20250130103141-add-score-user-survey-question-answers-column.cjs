const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_survey_question_answers',
    schema: {},
    columns: {
        score: {
            type: DataTypes.INTEGER,
            after: 'if_yes_how_much_bother',
        },
    },
    indexes: [],
});
