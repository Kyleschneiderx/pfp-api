module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('survey_questions', [
            {
                id: 1,
                question: 'Question 1',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                question: 'Question 2',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('survey_questions', null, {}),
};
