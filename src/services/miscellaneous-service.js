import * as dateFnsUtc from '@date-fns/utc';
import { Sequelize } from 'sequelize';
import {
    PREMIUM_USER_TYPE_ID,
    FREE_USER_TYPE_ID,
    EXPIRED_PURCHASE_STATUS,
    CANCELLED_PURCHASE_STATUS,
    GOOGLE_PAYMENT_PLATFORM,
    APPLE_PAYMENT_PLATFORM,
    PAID_PURCHASE_STATUS,
    SUBSCRIPTION_PRODUCTS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class MiscellaneousService {
    constructor({ logger, database, inAppPurchase }) {
        this.database = database;
        this.logger = logger;
        this.inAppPurchase = inAppPurchase;
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
            return this.database.models.SurveyQuestions.findAll({
                attributes: { exclude: ['deleted_at', 'group_id'] },
                include: [
                    {
                        model: this.database.models.SurveyQuestionGroups,
                        as: 'survey_question_group',
                        attributes: ['id', 'value', 'description'],
                        where: {},
                    },
                ],
                where: {},
                order: [['id', 'ASC']],
            });
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
            const [surveyQuestions, surveyQuestionAnswerScores, recordedAnswersResult, recordedAnswerByGroupResult] = await Promise.all([
                this.database.models.SurveyQuestions.findAll({}),
                this.database.models.SurveyQuestionAnswerScores.findAll({}),
                this.database.models.UserSurveyQuestionAnswers.findAll({ where: { user_id: userId } }),
                this.database.models.UserSurveyQuestionAnswerScores.findAll({ where: { user_id: userId } }),
            ]);

            const surveyQuestionGroups = {};

            surveyQuestions.forEach((item) => {
                surveyQuestionGroups[item.id] = item.group_id;
            });

            const answerScoresLegend = {};

            surveyQuestionAnswerScores.forEach((item) => {
                answerScoresLegend[item.key] = item.score;
            });

            const recordedAnswers = {};

            recordedAnswersResult.forEach((item) => {
                recordedAnswers[item.question_id] = item;
            });

            const recordedAnswerByGroupScores = {};

            recordedAnswerByGroupResult.forEach((item) => {
                recordedAnswerByGroupScores[item.question_group_id] = item;
            });

            return await this.database.transaction(async (transaction) => {
                let userTotalScore = 0;

                const userAnswerByGroupScores = {};

                await Promise.all(
                    answers.map(async (answer) => {
                        const answerScore = answer.yes_no === 'no' ? 0 : (answerScoresLegend[answer.if_yes_how_much_bother.replace(/\s/g, '_')] ?? 0);

                        userTotalScore += answerScore;

                        userAnswerByGroupScores[surveyQuestionGroups[answer.question_id]] =
                            (userAnswerByGroupScores[surveyQuestionGroups[answer.question_id]] ?? 0) + answerScore;

                        return this.database.models.UserSurveyQuestionAnswers.upsert(
                            {
                                id: recordedAnswers[answer.question_id]?.id,
                                user_id: userId,
                                question_id: answer.question_id,
                                yes_no: answer.yes_no,
                                if_yes_how_much_bother: answer.yes_no === 'no' ? '' : answer.if_yes_how_much_bother,
                                score: answerScore,
                            },
                            {
                                transaction: transaction,
                            },
                        );
                    }),
                );

                await Promise.all(
                    Object.keys(userAnswerByGroupScores).map(async (group) =>
                        this.database.models.UserSurveyQuestionAnswerScores.upsert(
                            {
                                id: recordedAnswerByGroupScores[group]?.id,
                                user_id: userId,
                                question_group_id: group,
                                score: userAnswerByGroupScores[group],
                            },
                            {
                                transaction: transaction,
                            },
                        ),
                    ),
                );

                return {
                    total: userTotalScore,
                    group: Object.keys(userAnswerByGroupScores).map((group) => ({
                        question_group_id: Number(group),
                        score: userAnswerByGroupScores[group],
                    })),
                };
            });
        } catch (error) {
            this.logger.error('Failed to answer survey', error);

            throw new exceptions.InternalServerError('Failed to answer survey', error);
        }
    }

    /**
     * Get user survey answers
     * @returns {Promise<SurveyQuestions[]>} SurveyQuestions instance
     * @throws {InternalServerError} If failed to get user survey answer
     */
    async getUserSurveyAnswers(userId) {
        try {
            return this.database.models.SurveyQuestions.findAll({
                attributes: { exclude: ['deleted_at', 'created_at', 'updated_at'] },
                include: [
                    {
                        model: this.database.models.UserSurveyQuestionAnswers,
                        as: 'user_survey_question_answer',
                        attributes: ['yes_no', 'if_yes_how_much_bother'],
                        required: false,
                        where: {
                            user_id: userId,
                        },
                    },
                ],
                where: {},
                order: [['id', 'ASC']],
            });
        } catch (error) {
            this.logger.error('Failed to get user survey answers', error);

            throw new exceptions.InternalServerError('Failed to get user survey answers', error);
        }
    }

    /**
     * Get user subscription by user id
     *
     * @param {number} userId User account id
     * @returns {Promise<UserSubscriptions>} UserSubscriptions instance
     * @throws {InternalServerError} If failed to get subscription by user id
     */
    async getPaymentByUserId(userId) {
        let subscription = null;
        try {
            subscription = await this.database.models.UserSubscriptions.findOne({
                attributes: ['package_id', 'expires_at'],
                where: {
                    user_id: userId,
                    status: {
                        [Sequelize.Op.notIn]: [EXPIRED_PURCHASE_STATUS, CANCELLED_PURCHASE_STATUS],
                    },
                },
                order: [['id', 'DESC']],
            });
        } catch (error) {
            this.logger.error('Failed to get subscription by user id', error);

            throw new exceptions.InternalServerError('Failed to get subscription by user id', error);
        }

        if (!subscription) {
            return {
                package_id: null,
                expires_at: null,
            };
        }

        subscription.dataValues.package_id = SUBSCRIPTION_PRODUCTS[subscription.dataValues.package_id];

        return subscription;
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
            const expiresAt = new dateFnsUtc.UTCDate(Number(data.receipt?.finalizedData?.expireDate));

            let payment = await this.database.models.UserSubscriptions.findOne({
                where: { user_id: data.userId, original_reference: data.receipt?.finalizedData?.originalReference, status: PAID_PURCHASE_STATUS },
                order: [['id', 'DESC']],
            });

            return await this.database.transaction(async (transaction) => {
                await this.database.models.UserSubscriptions.update(
                    { status: CANCELLED_PURCHASE_STATUS, cancel_at: new dateFnsUtc.UTCDate() },
                    { where: { user_id: data.userId }, transaction: transaction },
                );

                [payment] = await this.database.models.UserSubscriptions.upsert(
                    {
                        id: payment?.id,
                        user_id: data.userId,
                        response: JSON.stringify(data.receipt),
                        price: data.receipt?.finalizedData?.amount,
                        currency: data.receipt?.finalizedData?.currency,
                        status: data.receipt?.finalizedData?.status,
                        platform: data.receipt?.finalizedData?.platform,
                        expires_at: expiresAt,
                        reference: data.receipt?.finalizedData?.reference,
                        original_reference: data.receipt?.finalizedData?.originalReference,
                        package_id: data.receipt?.finalizedData?.productId,
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

    /**
     * Get payment by purchase original reference
     *
     * @param {string} reference Purchase reference
     * @returns {Promise<UserSubscriptions>}
     * @throws {InternalServerError} If failed to get purchase by reference
     */
    async getPaymentByOrignalReference(reference) {
        try {
            return await this.database.models.UserSubscriptions.findOne({
                where: { original_reference: reference, status: { [Sequelize.Op.ne]: CANCELLED_PURCHASE_STATUS } },
            });
        } catch (error) {
            this.logger.error('Failed to get purchase by reference', error);

            throw new exceptions.InternalServerError('Failed to get purchase by reference', error);
        }
    }

    async _expireGoogleSubscription(subscription, verifiedReceipt) {
        let updateSubscription = null;

        let isDowngradeUser = false;

        if (!verifiedReceipt.autoRenewing) {
            if (
                Number(new Date(new dateFnsUtc.UTCDate(Number(verifiedReceipt.expiryTimeMillis))).getTime()) <
                Number(new Date(new dateFnsUtc.UTCDate()).getTime())
            ) {
                updateSubscription = {
                    status: CANCELLED_PURCHASE_STATUS,
                    cancel_at: new dateFnsUtc.UTCDate(),
                };
                isDowngradeUser = true;
            }
        } else if (verifiedReceipt.paymentState === undefined) {
            if (verifiedReceipt.cancelReason !== undefined) {
                updateSubscription = {
                    status: CANCELLED_PURCHASE_STATUS,
                    cancel_at: new dateFnsUtc.UTCDate(),
                };
            } else {
                updateSubscription = {
                    status: CANCELLED_PURCHASE_STATUS,
                };
            }

            isDowngradeUser = true;
        } else {
            updateSubscription = {
                reference: verifiedReceipt.orderId,
                expires_at: new dateFnsUtc.UTCDate(Number(verifiedReceipt.expiryTimeMillis)),
            };
        }

        if (updateSubscription) {
            await this.database.models.UserSubscriptions.update(updateSubscription, { where: { id: subscription.id } });
        }

        if (isDowngradeUser) {
            await this.database.models.Users.update({ type_id: FREE_USER_TYPE_ID }, { where: { id: subscription.user_id } });
        }
    }

    async _expireAppleSubscription(subscription, verifiedReceipt) {
        let updateSubscription = null;

        let isDowngradeUser = false;

        if (verifiedReceipt.originalTransactionId === subscription.original_reference && verifiedReceipt.transactionId === subscription.reference) {
            if (verifiedReceipt.revocationReason !== undefined) {
                updateSubscription = {
                    status: CANCELLED_PURCHASE_STATUS,
                    cancel_at: verifiedReceipt.revocationDate ? new dateFnsUtc.UTCDate(Number(verifiedReceipt.revocationDate)) : null,
                };

                isDowngradeUser = true;
            }
            if (
                Number(new Date(new dateFnsUtc.UTCDate(Number(verifiedReceipt.expiresDate))).getTime()) <
                Number(new Date(new dateFnsUtc.UTCDate()).getTime())
            ) {
                updateSubscription = {
                    status: CANCELLED_PURCHASE_STATUS,
                    cancel_at: new dateFnsUtc.UTCDate(),
                };
                isDowngradeUser = true;
            }
        } else {
            updateSubscription = {
                reference: verifiedReceipt.transactionId,
                expires_at: new dateFnsUtc.UTCDate(Number(verifiedReceipt.expiresDate)),
            };
        }

        if (updateSubscription) {
            await this.database.models.UserSubscriptions.update(updateSubscription, { where: { id: subscription.id } });
        }

        if (isDowngradeUser) {
            await this.database.models.Users.update({ type_id: FREE_USER_TYPE_ID }, { where: { id: subscription.user_id } });
        }
    }

    /**
     * Process subscription checke
     *
     * @returns {Promise<void>}
     */
    async expireUserSubscriptions() {
        const platformProcessor = {
            [GOOGLE_PAYMENT_PLATFORM]: async (subscription, receipt) => {
                const verifiedReceipt = await this.inAppPurchase.verifyGooglePurchase({
                    packageName: receipt['verificationData.localVerificationData'].packageName,
                    productId: receipt['verificationData.localVerificationData'].productId,
                    purchaseToken: receipt['verificationData.localVerificationData'].purchaseToken,
                });

                await this._expireGoogleSubscription(subscription, verifiedReceipt);
            },
            [APPLE_PAYMENT_PLATFORM]: async (subscription, receipt) => {
                let latestTransaction;

                try {
                    [latestTransaction] = await this.inAppPurchase.verifyApplePurchase(receipt['verificationData.localVerificationData']);
                } catch (error) {
                    /** empty */
                }

                await this._expireAppleSubscription(subscription, latestTransaction);
            },
        };

        let appleSubscriptions;

        let androidSubscriptions;
        try {
            const overallSubscriptions = [];
            appleSubscriptions = await this.database.models.CheckSubscriptionQueues.findOne({
                where: {
                    platform: APPLE_PAYMENT_PLATFORM,
                    is_pending: true,
                },
                order: [['id', 'ASC']],
            });
            if (appleSubscriptions) {
                appleSubscriptions.is_pending = false;

                await appleSubscriptions.save();

                overallSubscriptions.push(appleSubscriptions);
            }

            androidSubscriptions = await this.database.models.CheckSubscriptionQueues.findOne({
                where: {
                    platform: GOOGLE_PAYMENT_PLATFORM,
                    is_pending: true,
                },
                order: [['id', 'ASC']],
            });
            if (androidSubscriptions) {
                androidSubscriptions.is_pending = false;

                await androidSubscriptions.save();

                overallSubscriptions.push(androidSubscriptions);
            }

            if (overallSubscriptions.length) {
                await Promise.all(
                    overallSubscriptions.map(async (queue) => {
                        queue.subscriptions = JSON.parse(queue.subscriptions);

                        await Promise.all(
                            queue.subscriptions.map(async (subscription) => {
                                await platformProcessor[subscription.platform](subscription, subscription.response);
                            }),
                        );
                    }),
                );
            }

            if (androidSubscriptions) {
                await androidSubscriptions.destroy({ force: true });
            }

            if (appleSubscriptions) {
                await appleSubscriptions.destroy({ force: true });
            }
        } catch (error) {
            if (androidSubscriptions) {
                await androidSubscriptions.destroy({ force: true });
            }

            if (appleSubscriptions) {
                await appleSubscriptions.destroy({ force: true });
            }

            this.logger.error('Failed to expire user subscriptions', error);

            throw new exceptions.InternalServerError('Failed to expire user subscriptions', error);
        }
    }

    /**
     * Generate a queue of subscription to be check
     *
     * @returns {Promise<void>}
     */
    async queueSubscriptionCheck() {
        const subscriptionQueue = async (platform, limit) => {
            const filter = {
                where: {
                    platform: platform,
                    status: {
                        [Sequelize.Op.notIn]: [EXPIRED_PURCHASE_STATUS, CANCELLED_PURCHASE_STATUS],
                    },
                },
            };

            const count = await this.database.models.UserSubscriptions.count(filter);

            const maxPage = Math.ceil(count / limit);

            const queues = (
                await Promise.all(
                    [...Array(maxPage).keys()].map(async (queryPage) => {
                        let subscriptions = await this.database.models.UserSubscriptions.findAll({
                            ...filter,
                            raw: true,
                            limit: limit,
                            offset: (queryPage + 1) * limit - limit,
                        });
                        if (!subscriptions) {
                            return [];
                        }

                        subscriptions = await Promise.all(
                            subscriptions.map((subscription) => {
                                try {
                                    subscription.response = JSON.parse(subscription.response);
                                } catch (error) {
                                    /** empty */
                                }

                                return subscription;
                            }),
                        );

                        return {
                            subscriptions: JSON.stringify(subscriptions),
                            platform: platform,
                            is_pending: true,
                        };
                    }),
                )
            ).flat();

            await this.database.models.CheckSubscriptionQueues.bulkCreate(queues);
        };

        try {
            await Promise.all([subscriptionQueue(GOOGLE_PAYMENT_PLATFORM, 10), subscriptionQueue(APPLE_PAYMENT_PLATFORM, 20)]);
        } catch (error) {
            this.logger.error('Failed to queue subscription check', error);

            throw new exceptions.InternalServerError('Failed to queue subscription check', error);
        }
    }
}
