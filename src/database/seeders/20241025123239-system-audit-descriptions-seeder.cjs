module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('system_audit_descriptions', [
            {
                id: 35,
                description: 'Deselect PF Plan',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('system_audit_descriptions', { id: 35 }, {}),
};
