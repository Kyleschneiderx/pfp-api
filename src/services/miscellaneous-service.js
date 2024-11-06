import { v4 as uuid } from 'uuid';
import { PREMIUM_USER_TYPE_ID } from '../constants/index.js';
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

    /**
     * Update user survey answer
     *
     * @param {number} userId User account id
     * @param {object} answers
     * @param {number} answers.question_id Survey question id
     * @param {string} answers.yes_no Answer for the yes or no question
     * @param {string=} answers.if_yes_how_much_bother Answer for the if yes, how much does it bother you? question
     * @returns {Promise<void>}
     */
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
                                yes_no: answer.yes_no,
                                if_yes_how_much_bother: answer.if_yes_how_much_bother,
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

    /**
     * Create payment for user subscription
     *
     * @param {object} data
     * @param {userId} data.userId User account id
     * @param {SubscriptionPackages} data.package SubscriptionPackages instance
     * @returns {Promise<UserSubscriptions>} UserSubscriptions instance
     * @throws {InternalServerError} If failed to create payment
     */
    async createPayment(data) {
        try {
            return await this.database.transaction(async (transaction) => {
                const payment = await this.database.models.UserSubscriptions.create(
                    {
                        user_id: data.userId,
                        response: JSON.stringify(data.receipt),
                    },
                    { transaction: transaction },
                );

                delete payment.dataValues.response;

                await this.database.models.Users.update(
                    { type_id: PREMIUM_USER_TYPE_ID },
                    {
                        where: { id: data.userId },
                        transaction: transaction,
                    },
                );

                return payment;
            });
        } catch (error) {
            this.logger.error('Failed to create payment', error);

            throw new exceptions.InternalServerError('Failed to create payment', error);
        }
    }

    async updatePayment(data) {
        try {
            const payment = await this.database.models.UserSubscriptions.create({
                user_id: data.userId,
                reference: uuid(),
                package_id: data.package.id,
                price: data.package.discounted_price ?? data.package.price,
            });

            delete payment.dataValues.package_id;

            delete data.package.dataValues.created_at;

            delete data.package.dataValues.updated_at;

            payment.dataValues.package = data.package;

            return payment;
        } catch (error) {
            this.logger.error('Failed to create payment', error);

            throw new exceptions.InternalServerError('Failed to create payemnt', error);
        }
    }
}
