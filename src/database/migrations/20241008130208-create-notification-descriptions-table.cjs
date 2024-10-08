const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'notification_descriptions',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        type_id: {
            type: DataTypes.INTEGER,
            comment: 'see notification_types table',
            references: {
                model: 'notification_types',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING(255),
        },
        description: {
            type: DataTypes.STRING(255),
        },
    },
    columns: {},
    indexes: [
        {
            name: 'notification_descriptions_type_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
    ],
});
