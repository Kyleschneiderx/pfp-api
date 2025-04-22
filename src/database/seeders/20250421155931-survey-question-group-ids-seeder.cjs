module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('survey_question_group_ids', [
            {
                question_id: 1,
                group_id: 1,
            },
            {
                question_id: 2,
                group_id: 1,
            },
            {
                question_id: 3,
                group_id: 1,
            },
            {
                question_id: 4,
                group_id: 1,
            },
            {
                question_id: 5,
                group_id: 1,
            },
            {
                question_id: 6,
                group_id: 1,
            },
            {
                question_id: 7,
                group_id: 2,
            },
            {
                question_id: 8,
                group_id: 2,
            },
            {
                question_id: 9,
                group_id: 2,
            },
            {
                question_id: 10,
                group_id: 2,
            },
            {
                question_id: 11,
                group_id: 2,
            },
            {
                question_id: 12,
                group_id: 2,
            },
            {
                question_id: 13,
                group_id: 2,
            },
            {
                question_id: 14,
                group_id: 2,
            },
            {
                question_id: 15,
                group_id: 3,
            },
            {
                question_id: 16,
                group_id: 3,
            },
            {
                question_id: 17,
                group_id: 3,
            },
            {
                question_id: 18,
                group_id: 3,
            },
            {
                question_id: 19,
                group_id: 3,
            },
            {
                question_id: 20,
                group_id: 3,
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('survey_question_group_ids', null, {}),
};
