module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('survey_question_groups', [
            {
                id: 1,
                value: 'POPDI-6',
                description: 'Pelvic Organ prolapse Distress Inventory 6',
            },
            {
                id: 2,
                value: 'CRAD-8',
                description: 'Colorectal-Anal distress Inventory 8',
            },
            {
                id: 3,
                value: 'UDI-6',
                description: 'Urinary distress Inventory 6',
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('', null, {}),
};
