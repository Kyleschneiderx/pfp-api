const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'user_survey_question_answer_scores',
    schema: {
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
            references: {
                model: 'survey_question_groups',
                key: 'id',
            },
        },
        score: {
            type: DataTypes.INTEGER,
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
    columns: {},
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
});
