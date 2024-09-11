const bcryptjs = require('bcryptjs');

module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('users', [
            {
                id: 1,
                email: 'admin@lakecitypt.com',
                password: bcryptjs.hashSync('password1W!', bcryptjs.genSaltSync(10)),
                type_id: 1,
                account_type_id: 1,
                status_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                email: 'dev@lakecitypt.com',
                password: bcryptjs.hashSync('password1W!', bcryptjs.genSaltSync(10)),
                type_id: 1,
                account_type_id: 1,
                status_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 3,
                email: 'free@lakecitypt.com',
                password: bcryptjs.hashSync('password1W!', bcryptjs.genSaltSync(10)),
                type_id: 1,
                account_type_id: 2,
                status_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 4,
                email: 'premium@lakecitypt.com',
                password: bcryptjs.hashSync('password1W!', bcryptjs.genSaltSync(10)),
                type_id: 2,
                account_type_id: 2,
                status_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('users', null, {}),
};
