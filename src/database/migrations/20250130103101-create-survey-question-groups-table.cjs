const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'survey_question_groups',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        value: {
            type: DataTypes.STRING(100),
        },
        description: {
            type: DataTypes.STRING(100),
        },
    },
    columns: {},
    indexes: [],
});
