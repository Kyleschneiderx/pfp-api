module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('system_audit_descriptions', [
            {
                id: 36,
                description: 'Duplicate PF Plan',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('system_audit_descriptions', { id: 36 }, {}),
};
