module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('user_profiles', [
            {
                id: 1,
                user_id: 1,
                name: 'System Admin',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('user_profiles', null, {}),
};
