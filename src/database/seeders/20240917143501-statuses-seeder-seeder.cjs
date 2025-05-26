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

    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await queryInterface.bulkDelete('statuses', null, {});
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    },
};
