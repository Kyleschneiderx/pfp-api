const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'survey_questions',
    schema: {
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
    columns: {},
    indexes: [],
});
