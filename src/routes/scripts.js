import express from 'express';

export default ({ verifyAdmin, database, helper }) => {
    const router = express.Router();

    router.use(verifyAdmin);

    router.get('/recompute-score', async (req, res) => {
        const [usersWithSurveys, surveyQuestionGroups, surveyQuestions, surveyQuestionAnswerScores] = await Promise.all([
            database.models.UserSurveyQuestionAnswers.findAll({ group: ['user_id'] }),
            database.models.SurveyQuestionGroups.findAll({
                include: { model: database.models.SurveyQuestionGroupIds, as: 'question_ids', separate: true },
            }),
            database.models.SurveyQuestions.findAll({
                include: [{ model: database.models.SurveyQuestionGroupIds, as: 'group_ids' }],
            }),
            database.models.SurveyQuestionAnswerScores.findAll({}),
        ]);

        const surveyQuestionGroupMap = {};

        let maxQuestionBinded = 0;

        const maxScore = 4;

        surveyQuestionGroups.forEach((item) => {
            surveyQuestionGroupMap[item.id] = item;

            if (item.question_ids.length > maxQuestionBinded) {
                maxQuestionBinded = item.question_ids.length;
            }
        });

        const surveyQuestionGroupIdsMap = {};

        surveyQuestions.forEach((item) => {
            surveyQuestionGroupIdsMap[item.id] = item.group_ids.map((groupId) => groupId.group_id);
        });

        const answerScoreMap = {};

        surveyQuestionAnswerScores.forEach((item) => {
            answerScoreMap[item.key] = item.score;
        });

        await Promise.all(
            usersWithSurveys.map(async (user) => {
                await database.models.UserSurveyQuestionAnswerScores.destroy({ force: true, where: { user_id: user.user_id } });

                const answers = await database.models.UserSurveyQuestionAnswers.findAll({
                    where: {
                        user_id: user.user_id,
                    },
                });

                const userAnswerByGroupScores = {};

                if (!answers) {
                    return false;
                }

                answers.forEach((answer) => {
                    const questionGroupIds = surveyQuestionGroupIdsMap[answer.question_id];

                    questionGroupIds.forEach((groupId) => {
                        if (userAnswerByGroupScores[groupId]) {
                            userAnswerByGroupScores[groupId].score += answer.score;
                        } else {
                            userAnswerByGroupScores[groupId] = {
                                user_id: answer.user_id,
                                question_group_id: groupId,
                                score: answer.score,
                                group_weight: surveyQuestionGroupMap[groupId].question_ids.length / maxQuestionBinded,
                                max_score: surveyQuestionGroupMap[groupId].question_ids.length * maxScore,
                                final_score: 0,
                                avg_score: 0,
                            };
                        }
                        userAnswerByGroupScores[groupId].avg_score =
                            userAnswerByGroupScores[groupId].score / userAnswerByGroupScores[groupId].max_score;
                        userAnswerByGroupScores[groupId].final_score =
                            userAnswerByGroupScores[groupId].avg_score * userAnswerByGroupScores[groupId].group_weight;
                    });
                });

                await database.models.UserSurveyQuestionAnswerScores.bulkCreate(
                    Object.keys(userAnswerByGroupScores).map((group) => ({
                        user_id: userAnswerByGroupScores[group].user_id,
                        question_group_id: userAnswerByGroupScores[group].question_group_id,
                        score: userAnswerByGroupScores[group].score,
                        max_score: userAnswerByGroupScores[group].max_score,
                        final_score: helper.toPercent(userAnswerByGroupScores[group].final_score),
                        avg_score: helper.toPercent(userAnswerByGroupScores[group].avg_score),
                        group_weight: helper.toPercent(userAnswerByGroupScores[group].group_weight),
                    })),
                );

                return true;
            }),
        );

        return res.json({ msg: 'Done' });
    });

    return router;
};
