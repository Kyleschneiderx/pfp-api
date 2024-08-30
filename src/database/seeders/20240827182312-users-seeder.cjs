module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('users', [
            {
                id: 1,
                email: 'admin@local.com',
                password: '$2a$10$sZUPfLlThnqvoJhWM0tJ1.jAE7vag5cmQ3BAUrYW4nMJbam4m7FRG',
                type_id: 1,
                account_type_id: 1,
                status_id: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('users', null, {}),
};
