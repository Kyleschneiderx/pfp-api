module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('notification_types', [
            {
                id: 1,
                value: 'System',
            },
            {
                id: 2,
                value: 'Account',
            },
            {
                id: 3,
                value: 'Workout',
            },
            {
                id: 4,
                value: 'Education',
            },
            {
                id: 5,
                value: 'PF Plan',
            },
            {
                id: 6,
                value: 'Subscription',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_types', null, {}),
};
