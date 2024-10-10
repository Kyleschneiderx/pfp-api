module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('notification_descriptions', [
            {
                id: 1,
                type_id: 1,
                title: 'Welcome',
                description: 'Welcome to Pelvic Floor PRO',
            },
            {
                id: 2,
                type_id: 1,
                title: 'Account Inactivity',
                description: 'You account has been marked as inactive',
            },
            {
                id: 3,
                type_id: 3,
                title: 'New Workout',
                description: 'New Workout: {name}',
            },
            {
                id: 4,
                type_id: 4,
                title: 'New Education',
                description: 'New Education: {title}',
            },
            {
                id: 5,
                type_id: 5,
                title: 'New PF Plan',
                description: 'New PF Plan: {name}',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_descriptions', null, {}),
};
