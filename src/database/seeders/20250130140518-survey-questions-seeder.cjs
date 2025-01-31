module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert(
            'survey_questions',
            [
                {
                    id: 1,
                    group_id: 1,
                },
                {
                    id: 2,
                    group_id: 1,
                },
                {
                    id: 3,
                    group_id: 1,
                },
                {
                    id: 4,
                    group_id: 1,
                },
                {
                    id: 5,
                    group_id: 1,
                },
                {
                    id: 6,
                    group_id: 1,
                },
                {
                    id: 7,
                    group_id: 2,
                },
                {
                    id: 8,
                    group_id: 2,
                },
                {
                    id: 9,
                    group_id: 2,
                },
                {
                    id: 10,
                    group_id: 2,
                },
                {
                    id: 11,
                    group_id: 2,
                },
                {
                    id: 12,
                    group_id: 2,
                },
                {
                    id: 13,
                    group_id: 2,
                },
                {
                    id: 14,
                    group_id: 2,
                },
                {
                    id: 15,
                    group_id: 3,
                },
                {
                    id: 16,
                    group_id: 3,
                },
                {
                    id: 17,
                    group_id: 3,
                },
                {
                    id: 18,
                    group_id: 3,
                },
                {
                    id: 19,
                    group_id: 3,
                },
                {
                    id: 20,
                    group_id: 3,
                },
            ],
            {
                updateOnDuplicate: ['id', 'group_id'],
            },
        ),

    down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('survey_questions', { group_id: null }, {}),
};
