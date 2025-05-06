const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'pf_plans',
    schema: {},
    columns: {
        user_id: {
            type: DataTypes.INTEGER,
            comment: 'see users table',
            after: 'photo',
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    indexes: [],
});
