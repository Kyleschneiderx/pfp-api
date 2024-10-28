module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('notification_descriptions', [
            {
                id: 6,
                type_id: 5,
                title: 'Daily PF Plan Reminder',
                description: "Don't forget to do your PF plan day {day} {name}",
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_descriptions', { id: 6 }, {}),
};
