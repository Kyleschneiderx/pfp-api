const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'survey_questions',
    schema: {},
    columns: {
        group_id: {
            type: DataTypes.INTEGER,
            comment: 'see survey_question_groups table',
            references: {
                model: 'survey_question_groups',
                key: 'id',
            },
            after: 'question',
        },
    },
    indexes: [
        {
            name: 'survey_questions_group_id',
            using: 'BTREE',
            fields: [{ name: 'group_id' }],
        },
    ],
});
