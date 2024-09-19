const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'workouts',
    schema: {},
    columns: {
        is_premium: {
            type: DataTypes.BOOLEAN,
            after: 'description',
        },
    },
    indexes: [
        {
            name: 'workouts_is_premium',
            using: 'BTREE',
            fields: [{ name: 'is_premium' }],
        },
        {
            name: 'workouts_status_id_is_premium',
            using: 'BTREE',
            fields: [{ name: 'status_id' }, { name: 'is_premium' }],
        },
    ],
});
