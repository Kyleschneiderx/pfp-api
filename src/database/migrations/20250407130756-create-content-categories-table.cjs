const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'content_categories',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        content_id: {
            type: DataTypes.INTEGER,
            comment: 'see educations, pf_plans tables',
        },
        content_type: {
            type: DataTypes.ENUM('educations', 'pf_plans'),
            comment: 'see educations, pf_plans tables',
        },
        category_id: {
            type: DataTypes.INTEGER,
            comment: 'see survey_question_groups table',
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
            name: 'content_categories_1',
            using: 'BTREE',
            fields: [{ name: 'category_id' }],
        },
        {
            name: 'content_categories_2',
            using: 'BTREE',
            fields: [{ name: 'content_id' }, { name: 'content_type' }],
        },
        {
            name: 'content_categories_3',
            using: 'BTREE',
            fields: [{ name: 'content_type' }, { name: 'category_id' }],
        },
        {
            name: 'content_categories_4',
            using: 'BTREE',
            fields: [{ name: 'content_id' }, { name: 'content_type' }, { name: 'category_id' }],
        },
    ],
});
