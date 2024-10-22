const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'system_audits',
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
        description_id: {
            type: DataTypes.INTEGER,
            comment: 'see system_audit_descriptions table',
            references: {
                model: 'system_audit_descriptions',
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
            name: 'system_audits_user_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'system_audits_description_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }],
        },
        {
            name: 'system_audits_user_id_description_id',
            using: 'BTREE',
            fields: [{ name: 'user_id' }, { name: 'description_id' }],
        },
    ],
});
