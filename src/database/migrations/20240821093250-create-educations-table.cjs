const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'educations',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(300),
        },
        content: {
            type: DataTypes.TEXT('long'),
        },
        photo: {
            type: DataTypes.STRING(300),
        },
        media_url: {
            type: DataTypes.STRING(300),
        },
        media_upload: {
            type: DataTypes.STRING(300),
        },
        status_id: {
            type: DataTypes.INTEGER,
            comment: 'see statuses table',
            references: {
                model: 'statuses',
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
            name: 'educations_title',
            using: 'BTREE',
            fields: [{ name: 'title' }],
        },
        {
            name: 'educations_status_id',
            using: 'BTREE',
            fields: [{ name: 'status_id' }],
        },
    ],
});
