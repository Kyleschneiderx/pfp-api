module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('system_audit_descriptions', [
            {
                id: 1,
                description: 'Create Account',
            },
            {
                id: 2,
                description: 'Update Account',
            },
            {
                id: 3,
                description: 'Remove Account',
            },
            {
                id: 4,
                description: 'Send Invite',
            },
            {
                id: 5,
                description: 'Forgot Password',
            },
            {
                id: 6,
                description: 'Reset Password',
            },
            {
                id: 7,
                description: 'Change Password',
            },
            {
                id: 8,
                description: 'Set up Password',
            },
            {
                id: 9,
                description: 'Create Exercise',
            },
            {
                id: 10,
                description: 'Update Exercise',
            },
            {
                id: 11,
                description: 'Remove Exercise',
            },
            {
                id: 12,
                description: 'Create Workout',
            },
            {
                id: 13,
                description: 'Update Workout',
            },
            {
                id: 14,
                description: 'Remove Workout',
            },
            {
                id: 15,
                description: 'Create PF Plan',
            },
            {
                id: 16,
                description: 'Update PF Plan',
            },
            {
                id: 17,
                description: 'Remove PF Plan',
            },
            {
                id: 18,
                description: 'Create Education',
            },
            {
                id: 19,
                description: 'Update Education',
            },
            {
                id: 20,
                description: 'Remove Education',
            },
            {
                id: 21,
                description: 'Remove Subscription',
            },
            {
                id: 22,
                description: 'Create Subscription Payment',
            },
            {
                id: 23,
                description: 'Subscribe',
            },
            {
                id: 24,
                description: 'Update PF Plan Progress',
            },
            {
                id: 25,
                description: 'Login',
            },
            {
                id: 26,
                description: 'Submit Survey',
            },
            {
                id: 27,
                description: 'Add Favorite Workout',
            },
            {
                id: 28,
                description: 'Remove Favorite Workout',
            },
            {
                id: 29,
                description: 'Add Favorite PF Plan',
            },
            {
                id: 30,
                description: 'Remove Favorite PF Plan',
            },
            {
                id: 31,
                description: 'Add Favorite Education',
            },
            {
                id: 32,
                description: 'Remove Favorite Education',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('system_audit_descriptions', null, {}),
};
