import * as dateFnsUtc from '@date-fns/utc';
import { Sequelize } from 'sequelize';
import crypto from 'crypto-js';
import {
    PREMIUM_USER_TYPE_ID,
    FREE_USER_TYPE_ID,
    EXPIRED_PURCHASE_STATUS,
    CANCELLED_PURCHASE_STATUS,
    GOOGLE_PAYMENT_PLATFORM,
    APPLE_PAYMENT_PLATFORM,
    SUBSCRIPTION_PRODUCTS,
    PAGES_TO_TRACK,
    BILLING_RETRY_PURCHASE_STATUS,
    INCOMPLETE_PURCHASE_STATUS,
    ACTIVE_PURCHASE_STATUS,
    CONVERSION_API_EVENTS,
    PUBLISHED_PF_PLAN_STATUS_ID,
} from '../constants/index.js';
import { WEBHOOK_EVENTS as REVENUECAT_WEBHOOK_EVENTS, CANCELLATION_REASON as REVENUECAT_CANCELLATION_REASON } from '../common/revenuecat/index.js';
import * as exceptions from '../exceptions/index.js';

export default class MiscellaneousService {
    constructor({ logger, database, inAppPurchase, revenuecat, facebookPixel, helper }) {
        this.database = database;
        this.logger = logger;
        this.inAppPurchase = inAppPurchase;
        this.revenuecat = revenuecat;
        this.facebookPixel = facebookPixel;
        this.helper = helper;
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
        const dbTransaction = await this.database.transaction();
        try {
            const [surveyQuestionGroups, surveyQuestions, surveyQuestionAnswerScores, userSurveyQuestionAnswers, userSurveyQuestionAnswerScores] =
                await Promise.all([
                    this.database.models.SurveyQuestionGroups.findAll({
                        include: { model: this.database.models.SurveyQuestionGroupIds, as: 'question_ids', separate: true },
                    }),
                    this.database.models.SurveyQuestions.findAll({
                        include: [{ model: this.database.models.SurveyQuestionGroupIds, as: 'group_ids' }],
                    }),
                    this.database.models.SurveyQuestionAnswerScores.findAll({}),
                    this.database.models.UserSurveyQuestionAnswers.findAll({ where: { user_id: userId } }),
                    this.database.models.UserSurveyQuestionAnswerScores.findAll({ where: { user_id: userId }, order: [['score', 'DESC']] }),
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

            const userSurveyQuestionAnswerMap = {};

            userSurveyQuestionAnswers.forEach((item) => {
                userSurveyQuestionAnswerMap[item.question_id] = item;
            });

            const userSurveyQuestionAnswerScoresMap = {};

            userSurveyQuestionAnswerScores.forEach((item) => {
                userSurveyQuestionAnswerScoresMap[item.question_group_id] = item;
            });

            let userTotalScore = 0;

            const userAnswerByGroupScores = {};

            await Promise.all(
                answers.map(async (answer) => {
                    answer.if_yes_how_much_bother = answer.if_yes_how_much_bother?.toLowerCase();

                    const answerScore = answer.yes_no === 'no' ? 0 : (answerScoreMap[answer.if_yes_how_much_bother.replace(/\s/g, '_')] ?? 0);

                    userTotalScore += answerScore;

                    const questionGroupIds = surveyQuestionGroupIdsMap[answer.question_id];

                    questionGroupIds.forEach((groupId) => {
                        if (userAnswerByGroupScores[groupId]) {
                            userAnswerByGroupScores[groupId].score += answerScore;
                        } else {
                            userAnswerByGroupScores[groupId] = {
                                score: answerScore,
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

                    return this.database.models.UserSurveyQuestionAnswers.upsert({
                        id: userSurveyQuestionAnswerMap[answer.question_id]?.id,
                        user_id: userId,
                        question_id: answer.question_id,
                        yes_no: answer.yes_no,
                        if_yes_how_much_bother: answer.yes_no === 'no' ? '' : answer.if_yes_how_much_bother,
                        score: answerScore,
                    });
                }),
            );

            await Promise.all(
                Object.keys(userAnswerByGroupScores).map(async (group) =>
                    this.database.models.UserSurveyQuestionAnswerScores.upsert({
                        id: userSurveyQuestionAnswerScoresMap[group]?.id,
                        user_id: userId,
                        question_group_id: group,
                        score: userAnswerByGroupScores[group].score,
                        final_score: this.helper.toPercent(userAnswerByGroupScores[group].final_score),
                        avg_score: this.helper.toPercent(userAnswerByGroupScores[group].avg_score),
                        group_weight: this.helper.toPercent(userAnswerByGroupScores[group].group_weight),
                    }),
                ),
            );

            await dbTransaction.commit();

            return {
                score: userTotalScore,
                total: surveyQuestions.length * maxScore,
                groups:
                    userTotalScore > 0
                        ? Object.keys(userAnswerByGroupScores).map((group) => {
                              delete surveyQuestionGroupMap[group].dataValues.value;

                              delete surveyQuestionGroupMap[group].dataValues.question_ids;

                              return {
                                  group: surveyQuestionGroupMap[group],
                                  score: userAnswerByGroupScores[group].score,
                                  total: userAnswerByGroupScores[group].max_score,
                              };
                          })
                        : surveyQuestionGroups
                              .filter((group) => group.question_ids.length === 0)
                              .map((group) => {
                                  delete group.dataValues.value;

                                  const groupQuestionCount = surveyQuestionGroupMap[group].question_ids.length;

                                  delete group.dataValues.question_ids;

                                  return {
                                      group: group,
                                      score: 0,
                                      total: groupQuestionCount * maxScore,
                                  };
                              }),
            };
        } catch (error) {
            await dbTransaction.rollback();

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
     * @param {number} data.userId User account id
     * @param {object} data.reference Purchase reference
     * @returns {Promise<UserSubscriptions>} UserSubscriptions instance
     * @throws {InternalServerError} If failed to create payment
     */
    async createPayment(data) {
        try {
            let payment = await this.database.models.UserSubscriptions.findOne({
                where: {
                    user_id: data.userId,
                    reference: data?.reference,
                    status: {
                        [Sequelize.Op.notIn]: [
                            EXPIRED_PURCHASE_STATUS,
                            BILLING_RETRY_PURCHASE_STATUS,
                            INCOMPLETE_PURCHASE_STATUS,
                            CANCELLED_PURCHASE_STATUS,
                        ],
                    },
                },
                order: [['id', 'DESC']],
            });

            const [userPfPlan, userSurveyScoresSummary] = await Promise.all([
                this.database.models.UserPfPlans.findOne({ where: { user_id: data.userId } }),
                this.database.models.UserSurveyQuestionAnswerScores.findAll({ where: { user_id: data.userId }, order: [['final_score', 'DESC']] }),
            ]);

            return await this.database.transaction(async (transaction) => {
                await this.database.models.UserSubscriptions.update(
                    {
                        status: CANCELLED_PURCHASE_STATUS,
                        cancel_at: new dateFnsUtc.UTCDate(),
                    },
                    { where: { user_id: data.userId }, transaction: transaction },
                );

                [payment] = await this.database.models.UserSubscriptions.upsert(
                    {
                        id: payment?.id,
                        user_id: data.userId,
                        reference: data?.reference,
                        status: ACTIVE_PURCHASE_STATUS,
                        original_reference: data?.reference,
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

                const groupScoreMap = {};

                userSurveyScoresSummary.forEach((item) => {
                    groupScoreMap[item.question_group_id] = item.final_score;
                });

                const highestScore = Math.max(...Object.values(groupScoreMap));

                if (!userPfPlan) {
                    const surveyQuestionGroups = await this.database.models.SurveyQuestionGroups.findAll({
                        include: { model: this.database.models.SurveyQuestionGroupIds, as: 'question_ids', separate: true },
                    });

                    const recommendPfPlan = await this.database.models.PfPlans.scope([
                        {
                            method: [
                                'withCategories',
                                {
                                    where: {
                                        id:
                                            highestScore === 0
                                                ? surveyQuestionGroups.filter((group) => group.question_ids.length === 0).map((group) => group.id)
                                                : Object.entries(groupScoreMap)
                                                      .filter(([, score]) => score === highestScore)
                                                      .map(([key]) => key),
                                    },
                                    required: true,
                                },
                            ],
                        },
                        { method: ['defaultOrder', this.database.literal(`RAND()`)] },
                    ]).findOne({
                        nest: true,
                        subQuery: false,
                        where: { status_id: PUBLISHED_PF_PLAN_STATUS_ID, is_custom: true, user_id: null },
                    });

                    if (recommendPfPlan) {
                        const dateToday = new dateFnsUtc.UTCDate();

                        let startAt = dateToday;

                        const lastRecordOfNewPfPlan = await this.database.models.UserPfPlans.findOne({
                            where: { user_id: data.userId, pf_plan_id: recommendPfPlan.id },
                            order: [['id', 'DESC']],
                            paranoid: false,
                        });

                        startAt = lastRecordOfNewPfPlan ? lastRecordOfNewPfPlan.start_at : startAt;

                        await this.database.models.UserPfPlans.create(
                            {
                                user_id: data.userId,
                                pf_plan_id: recommendPfPlan.id,
                                start_at: startAt,
                            },
                            { transaction: transaction },
                        );
                    }
                }

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
    async getPaymentByOriginalReference(reference) {
        try {
            return await this.database.models.UserSubscriptions.findOne({
                where: { original_reference: reference, status: ACTIVE_PURCHASE_STATUS },
            });
        } catch (error) {
            this.logger.error('Failed to get purchase by reference', error);

            throw new exceptions.InternalServerError('Failed to get purchase by reference', error);
        }
    }

    /**
     * Get payment by purchase reference
     *
     * @param {string} reference Purchase reference
     * @returns {Promise<UserSubscriptions>}
     * @throws {InternalServerError} If failed to get purchase by reference
     */
    async getPaymentByReference(reference) {
        try {
            return await this.database.models.UserSubscriptions.findOne({
                where: { reference: reference, status: ACTIVE_PURCHASE_STATUS },
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

    /**
     * Record device visit to pages
     *
     * @param {object} data
     * @param {string} data.deviceId Device unique id
     * @param {string} data.page Page visited
     * @returns {Promise<PageVisits>}
     * @throws {InternalServerError} Failed to record page visit
     */
    async createPageVisit(data) {
        try {
            const pageVisited = await this.database.models.PageVisits.findOne({
                where: {
                    device_id: data.deviceId,
                    page: data.page,
                },
            });
            if (pageVisited) {
                return pageVisited;
            }

            const totalPageVisit = await this.database.models.PageVisits.count({
                where: {
                    page: data.page,
                },
            });

            return this.database.models.PageVisits.create({ device_id: data.deviceId, page: data.page, total: totalPageVisit + 1 });
        } catch (error) {
            this.logger.error('Failed to record page visit.', error);

            throw new exceptions.InternalServerError('Failed to record page visit.', error);
        }
    }

    /**
     * Get page visits statistics
     *
     * @returns {<Promise<{
     *  total: number,
     *  pages: {
     *     page: string,
     *     label: string,
     *     total: number,
     *     percentage: number
     *  }[]
     * }>}
     * @throws {InternalServerError} Failed to get page visit stats
     *
     */
    async getPageVisitStats() {
        try {
            const stats = await this.database.models.PageVisits.findAll({
                attributes: {
                    exclude: [],
                },
                where: {
                    id: {
                        [Sequelize.Op.in]: Sequelize.literal(
                            `(${this.database.dialect.queryGenerator
                                .selectQuery('page_visits', {
                                    attributes: [[Sequelize.fn('Max', Sequelize.col('id')), 'id']],
                                    group: ['page'],
                                })
                                .slice(0, -1)})`,
                        ),
                    },
                },
            });

            const totalDevice = await this.database.models.PageVisits.count({
                distinct: true,
                col: 'device_id',
            });

            const pagesToTrack = {};

            Object.keys(PAGES_TO_TRACK).forEach((key) => {
                if (PAGES_TO_TRACK[key] !== PAGES_TO_TRACK.WELCOME) {
                    pagesToTrack[PAGES_TO_TRACK[key]] = {
                        label: key,
                        total: 0,
                    };
                }
            });

            stats.forEach((stat) => {
                if (stat.page !== PAGES_TO_TRACK.WELCOME) {
                    pagesToTrack[stat.page].total = stat.total;
                }
            });

            return {
                total: totalDevice ?? 0,
                pages: Object.keys(pagesToTrack).map((page) => ({
                    page: page,
                    label: pagesToTrack[page].label,
                    total: pagesToTrack[page].total,
                    percentage: totalDevice ? Math.round((pagesToTrack[page].total / totalDevice) * 100) : 0,
                })),
            };
        } catch (error) {
            this.logger.error('Failed to get page visit stats.', error);

            throw new exceptions.InternalServerError('Failed to get page visit stats.', error);
        }
    }

    /**
     * Process RevenueCat webhooks
     *
     * @param {object} data
     * @returns {Promise<void>}
     * @throws {InternalServerError} Failed to process RevenueCat webhook.
     */
    async processRevenuecatWebhook(data) {
        try {
            this.database.models.RevenuecatWebhooks.create({
                data: JSON.stringify(data),
            });

            const { event } = data;

            const allowedEvents = [
                REVENUECAT_WEBHOOK_EVENTS.INITIAL_PURCHASE,
                REVENUECAT_WEBHOOK_EVENTS.RENEWAL,
                REVENUECAT_WEBHOOK_EVENTS.CANCELLATION,
                REVENUECAT_WEBHOOK_EVENTS.EXPIRATION,
            ];
            if (!allowedEvents.includes(event.type)) {
                return;
            }

            const appUserId = this.revenuecat.parseCustomerId(event.app_user_id);

            const userSubscription = await this.database.models.UserSubscriptions.findOne({
                where: { user_id: appUserId, original_reference: event.original_transaction_id, status: ACTIVE_PURCHASE_STATUS },
                order: [['id', 'DESC']],
            });

            if (!userSubscription) {
                throw new exceptions.InternalServerError('Reference does not exist.');
            }

            const user = await this.database.models.Users.findOne({ where: { id: appUserId } });

            const updateUserSubscriptionPayload = {
                reference: event.transaction_id,
                package_id: event.product_id.includes(':') ? event.product_id.split(':')[0] : event.product_id,
                platform: event?.store?.toLowerCase(),
                expires_at: new dateFnsUtc.UTCDate(Number(event.expiration_at_ms)),
                currency: event.currency,
            };

            if (event.type !== REVENUECAT_WEBHOOK_EVENTS.EXPIRATION) {
                updateUserSubscriptionPayload.price = event.price_in_purchased_currency;
            }

            if (event.type === REVENUECAT_WEBHOOK_EVENTS.INITIAL_PURCHASE) {
                updateUserSubscriptionPayload.response = JSON.stringify(event);
            }

            if (![REVENUECAT_WEBHOOK_EVENTS.RENEWAL, REVENUECAT_WEBHOOK_EVENTS.INITIAL_PURCHASE].includes(event.type)) {
                updateUserSubscriptionPayload.cancel_at = new dateFnsUtc.UTCDate();
                updateUserSubscriptionPayload.status = EXPIRED_PURCHASE_STATUS;
            }

            if (event.type === REVENUECAT_WEBHOOK_EVENTS.CANCELLATION) {
                if (
                    [REVENUECAT_CANCELLATION_REASON.DEVELOPER_INITIATED, REVENUECAT_CANCELLATION_REASON.CUSTOMER_SUPPORT].includes(
                        event.cancel_reason,
                    )
                ) {
                    updateUserSubscriptionPayload.status = CANCELLED_PURCHASE_STATUS;
                }
            }

            this.database.models.UserSubscriptions.update(updateUserSubscriptionPayload, { where: { id: userSubscription.id } });

            if ([EXPIRED_PURCHASE_STATUS, CANCELLED_PURCHASE_STATUS].includes(updateUserSubscriptionPayload.status)) {
                await this.database.models.Users.update({ type_id: FREE_USER_TYPE_ID }, { where: { id: userSubscription.user_id } });
            }

            const conversionApiEvent = CONVERSION_API_EVENTS[event.type?.toUpperCase()];
            if (conversionApiEvent) {
                try {
                    this.facebookPixel.createEvent(conversionApiEvent, {
                        event_id: crypto.SHA256(`${userSubscription.user_id}|${conversionApiEvent ?? 'Unknown'}|${event.transaction_id}`).toString(),
                        user_data: {
                            em: crypto.SHA256(user.email).toString(),
                        },
                        custom_data: {
                            currency: event.currency,
                            value: event.price_in_purchased_currency,
                            transaction_id: event.transaction_id,
                        },
                    });
                } catch (error) {
                    this.logger.error('Failed to send event to conversion api.', error);
                }
            }
        } catch (error) {
            this.logger.error('Failed to process RevenueCat webhook.', error);

            throw new exceptions.InternalServerError('Failed to process RevenueCat webhook.', error);
        }
    }
}
