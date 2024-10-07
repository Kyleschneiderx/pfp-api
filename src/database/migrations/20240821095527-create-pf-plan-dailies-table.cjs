const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plan_dailies',
    schema: {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        pf_plan_id: {
            type: DataTypes.INTEGER,
            comment: 'see pf_plans table',
            references: {
                model: 'pf_plans',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING(200),
        },
        day: {
            type: DataTypes.INTEGER,
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
            name: 'pf_plan_dailies_pf_plan_id',
            using: 'BTREE',
            fields: [{ name: 'pf_plan_id' }],
        },
        {
            name: 'pf_plan_dailies_name',
            using: 'BTREE',
            fields: [{ name: 'name' }],
        },
    ],
});
