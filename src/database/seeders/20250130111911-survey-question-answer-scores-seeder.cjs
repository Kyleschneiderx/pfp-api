module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('survey_question_answer_scores', [
            {
                id: 1,
                key: 'not_at_all',
                score: 1,
            },
            {
                id: 2,
                key: 'somewhat',
                score: 2,
            },
            {
                id: 3,
                key: 'moderately',
                score: 3,
            },
            {
                id: 4,
                key: 'quite_a_bit',
                score: 4,
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('', null, {}),
};
