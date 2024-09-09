module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('statuses', [
            {
                id: 1,
                value: 'Active',
            },
            {
                id: 2,
                value: 'Inactive',
            },
            {
                id: 3,
                value: 'Used',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('statuses', null, {}),
};
