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
            type: DataTypes.TEXT,
        },
        video_url: {
            type: DataTypes.STRING(300),
        },
        video_upload: {
            type: DataTypes.STRING(300),
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
    ],
});
