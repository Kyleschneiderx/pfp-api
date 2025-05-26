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
            {
                id: 2,
                user_id: 2,
                name: 'Dev Admin',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 3,
                user_id: 3,
                name: 'Free User',
                contact_number: '83448253183',
                birthdate: '1990-01-01',
                description: 'I am a free user',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 4,
                user_id: 4,
                name: 'Premium User',
                contact_number: '66507701766',
                birthdate: '1990-01-02',
                description: 'I am a premium user',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await queryInterface.bulkDelete('user_profiles', null, {});
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    },
};
