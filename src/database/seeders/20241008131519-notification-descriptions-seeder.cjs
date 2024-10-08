module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('notification_descriptions', [
            {
                id: 1,
                type_id: 'System',
                title: 'Welcome',
                description: 'Welcome to Pelvic Floor PRO',
            },
            {
                id: 2,
                type_id: 'System',
                title: 'Account Inactivity',
                description: 'You account has been marked as inactive',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_descriptions', null, {}),
};
