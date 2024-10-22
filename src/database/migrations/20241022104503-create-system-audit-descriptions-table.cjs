const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'system_audit_descriptions',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        description: {
            type: DataTypes.STRING(255),
        },
    },
    columns: {},
    indexes: [],
});
