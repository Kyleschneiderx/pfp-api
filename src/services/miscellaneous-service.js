import * as exceptions from '../exceptions/index.js';

export default class MiscellaneousService {
    constructor({ logger, database }) {
        this.database = database;
        this.logger = logger;
    }

    /**
     * Get app privacy policy
     * @returns {Promise<AppStaticContents[]>} AppStaticContents instance
     * @throws {InternalServerError} If failed to get app privacy policy
     */
    async getPrivacyPolicy() {
        try {
            return this.database.models.AppStaticContents.findOne({ attributes: ['id', 'key', 'content'], where: { key: 'privacy_policy' } });
        } catch (error) {
            this.logger.error('Failed to get app privacy policy', error);

            throw new exceptions.InternalServerError('Failed to get app privacy policy', error);
        }
    }

    /**
     * Get app about app
     * @returns {Promise<AppStaticContents[]>} AppStaticContents instance
     * @throws {InternalServerError} If failed to get app privacy policy
     */
    async getAboutApp() {
        try {
            return this.database.models.AppStaticContents.findOne({ attributes: ['id', 'key', 'content'], where: { key: 'about_app' } });
        } catch (error) {
            this.logger.error('Failed to get app about app', error);

            throw new exceptions.InternalServerError('Failed to get app about app', error);
        }
    }

    /**
     * Get premium survey questions
     * @returns {Promise<SurveyQuestions[]>} SurveyQuestions instance
     * @throws {InternalServerError} If failed to get survey questions
     */
    async getSurveyQuestions() {
        try {
            return this.database.models.SurveyQuestions.findAll({ attributes: { exclude: ['deleted_at'] }, where: {}, order: [['id', 'ASC']] });
        } catch (error) {
            this.logger.error('Failed to get survey questions', error);

            throw new exceptions.InternalServerError('Failed to get survey questions', error);
        }
    }

    /**
     * Check if survey question exist by id
     *
     * @param {number} id Survey question id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check survey question
     */
    async isSurveyQuestionExistById(id) {
        try {
            return Boolean(await this.database.models.SurveyQuestions.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error('Failed to check survey question', error);

            throw new exceptions.InternalServerError('Failed to check survey question', error);
        }
    }

    async updateUserSurveyAnswer(userId, answers) {
        try {
            const recordedAnswersResult = await this.database.models.UserSurveyQuestionAnswers.findAll({ where: { user_id: userId } });

            const recordedAnswers = {};

            recordedAnswersResult.forEach((item) => {
                recordedAnswers[item.question_id] = item;
            });

            return await this.database.transaction(async (transaction) => {
                await Promise.all(
                    answers.map(async (answer) =>
                        this.database.models.UserSurveyQuestionAnswers.upsert(
                            {
                                id: recordedAnswers[answer.question_id]?.id,
                                user_id: userId,
                                question_id: answer.question_id,
                                answer: answer.answer,
                            },
                            {
                                transaction: transaction,
                            },
                        ),
                    ),
                );
            });
        } catch (error) {
            this.logger.error('Failed to answer survey', error);

            throw new exceptions.InternalServerError('Failed to answer survey', error);
        }
    }
}
