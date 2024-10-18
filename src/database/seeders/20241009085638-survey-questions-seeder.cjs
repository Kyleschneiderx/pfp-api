module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('survey_questions', [
            {
                id: 1,
                question: 'Do you usually experience pressure in the lower abdomen?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                question: 'Do you usually experience heaviness or dullness in the lower abdomen?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 3,
                question: 'Do you usually have a bulge or something falling out that you can see or fell in the vaginal area?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 4,
                question: 'Do you usually have to push on the vagina or around the rectum to have a complete bowel movement?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 5,
                question: 'Do you usually experience a feeling of incomplete bladder emptying?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 6,
                question: 'Do you ever have to push up in the vaginal area with your fingers to start or complete urination?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 7,
                question: 'Do you feel you need to strain too hard to have a bowel movement?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 8,
                question: 'Do you feel you have not completely emptied your bowels at the end of a bowel movement?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 9,
                question: 'Do you usually lose stool beyond your control if your stool is well formed?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 10,
                question: 'Do you usually lose stool beyond your control if you stool is loose or liquid?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 11,
                question: 'Do you usually lose gas from the rectum beyond your control?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 12,
                question: 'Do you usually have pain when you pass your stool?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 13,
                question: 'Do you experience a strong sense of urgency and have to rush to the bathroom to have a bowel movement?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 14,
                question: 'Does part of your stool ever pass through the rectum and bulge outside during or after a bowel movement?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 15,
                question: 'Do you usually experience frequent urination?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 16,
                question:
                    'Do you usually experience urine leakage associated with a feeling of urgency; that is, a strong sensation of needing to go to the bathroom?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 17,
                question: 'Do you usually experience urine leakage related to laughing, coughing, or sneezing?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 18,
                question: 'Do you usually experience small amounts of urine leakage (that is, drops)?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 19,
                question: 'Do you usually experience difficulty emptying your bladder?',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 20,
                question: 'Do you usually experience pain of discomfort in the lower abdomen or genital region?',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('survey_questions', null, {}),
};
