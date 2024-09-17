module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('statuses', [
            {
                id: 4,
                value: 'Draft',
            },
            {
                id: 5,
                value: 'Published',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('statuses', null, {}),
};
