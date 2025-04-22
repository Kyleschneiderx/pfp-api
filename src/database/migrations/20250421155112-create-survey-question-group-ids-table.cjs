const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'survey_question_group_ids',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        question_id: {
            type: DataTypes.INTEGER,
            comment: 'see survey_questions tables',
            references: {
                model: 'survey_questions',
                key: 'id',
            },
        },
        group_id: {
            type: DataTypes.INTEGER,
            comment: 'see survey_question_groups tables',
            references: {
                model: 'survey_question_groups',
                key: 'id',
            },
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
            name: 'survey_question_group_ids_2',
            using: 'BTREE',
            fields: [{ name: 'group_id' }],
        },
        {
            name: 'survey_question_group_ids_3',
            using: 'BTREE',
            fields: [{ name: 'question_id' }],
        },
        {
            name: 'survey_question_group_ids_1',
            using: 'BTREE',
            fields: [{ name: 'question_id' }, { name: 'group_id' }],
        },
    ],
});
