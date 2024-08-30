module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('statuses', [
            {
                id: 1,
                value: 'Active',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('statuses', null, {}),
};
