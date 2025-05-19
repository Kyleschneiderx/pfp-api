const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'image_optimization_logs',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        resource: {
            type: DataTypes.STRING(50),
        },
        resource_id: {
            type: DataTypes.INTEGER,
        },
        log: {
            type: DataTypes.TEXT('long'),
        },
        error: {
            type: DataTypes.TEXT('long'),
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
            name: 'image_optimization_logs_1',
            using: 'BTREE',
            fields: [{ name: 'resource' }, { name: 'resource_id' }],
        },
    ],
});
