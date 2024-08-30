module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('user_types', [
            {
                id: 1,
                value: 'Free',
            },
            {
                id: 2,
                value: 'Premium',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('user_types', null, {}),
};
