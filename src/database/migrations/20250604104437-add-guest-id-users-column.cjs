const { DataTypes } = require('sequelize');
const createMigration = require('../../utils/sequelize-migration.cjs');

module.exports = createMigration({
    table: 'users',
    schema: {},
    columns: {
        guest_id: {
            type: DataTypes.STRING(150),
            after: 'password',
        },
    },
    indexes: [
        {
            using: 'BTREE',
            unique: true,
            fields: [{ name: 'guest_id' }],
        },
    ],
});
