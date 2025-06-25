module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('notification_descriptions', [
            {
                id: 7,
                type_id: 1,
                title: 'Start Simple',
                description: "A few minutes a day can make a difference. Explore the PF plan if you're curious.",
            },
            {
                id: 8,
                type_id: 1,
                title: 'Your Routine, Your Pace',
                description: 'Building a habit? Our PF plan is here to guide you—start anytime.',
            },
            {
                id: 9,
                type_id: 1,
                title: 'Your Body Will Thank You',
                description: 'Need a little guidance? The PF plan is designed to help, if and when you need it.',
            },
            {
                id: 10,
                type_id: 1,
                title: 'Build the Habit',
                description: "Sticking to a routine is easier with a plan—subscribe if you're ready to commit.",
            },
            {
                id: 11,
                type_id: 1,
                title: 'You’ve Got This!',
                description: 'Small steps every day make all the difference. Time for your PF workout?',
            },
            {
                id: 12,
                type_id: 1,
                title: 'Quick Check-In',
                description: 'Haven’t done your PF session yet? It’s a great time to get it in!',
            },
            {
                id: 13,
                type_id: 1,
                title: 'Keep the Streak Alive',
                description: 'Daily effort adds up fast. Your next PF session is waiting!',
            },
            {
                id: 14,
                type_id: 1,
                title: 'Back to the Mat?',
                description: 'Even a short session today counts. Let’s keep your PF plan on track.',
            },
            {
                id: 15,
                type_id: 1,
                title: 'Staying Consistent Feels Good',
                description: 'You’re doing great—tap in and knock out your PF workout when you’re ready.',
            },
            {
                id: 16,
                type_id: 1,
                title: 'Reminder to Show Up for Yourself',
                description: 'One session at a time. Your body will thank you—open your PF plan anytime.',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_descriptions', { id: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16] }, {}),
};
