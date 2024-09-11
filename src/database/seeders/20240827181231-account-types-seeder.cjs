module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('account_types', [
            {
                id: 1,
                value: 'Admin',
            },
            {
                id: 2,
                value: 'User',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('account_types', null, {}),
};
