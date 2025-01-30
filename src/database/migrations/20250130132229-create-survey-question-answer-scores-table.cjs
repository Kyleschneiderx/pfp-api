const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'survey_question_answer_scores',
    schema: {
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
    columns: {},
    indexes: [
        {
            name: 'survey_question_answer_scores_1',
            using: 'BTREE',
            fields: [{ name: 'key' }],
        },
    ],
});
