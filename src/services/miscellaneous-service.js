import * as dateFns from 'date-fns';
import * as dateFnsUtc from '@date-fns/utc';
import { Sequelize } from 'sequelize';
import {
    PREMIUM_USER_TYPE_ID,
    FREE_USER_TYPE_ID,
    EXPIRED_PURCHASE_STATUS,
    CANCELLED_PURCHASE_STATUS,
    GOOGLE_PAYMENT_PLATFORM,
    APPLE_PAYMENT_PLATFORM,
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
            const expiresAt = new dateFnsUtc.UTCDate(Number(data.receipt?.finalizedData?.expireDate));

            return await this.database.transaction(async (transaction) => {
                this.database.models.UserSubscriptions.update(
                    { status: CANCELLED_PURCHASE_STATUS, cancel_at: new dateFnsUtc.UTCDate() },
                    { where: { user_id: data.userId }, transaction: transaction },
                );

                const payment = await this.database.models.UserSubscriptions.create(
                    {
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

    async _expireGoogleSubscription(subscription, verifiedReceipt) {
        let updateSubscription = null;

        let isDowngradeUser = false;

        if (verifiedReceipt.cancelReason !== undefined) {
            updateSubscription = {
                status: CANCELLED_PURCHASE_STATUS,
                cancel_at: verifiedReceipt.userCancellationTimeMillis
                    ? new dateFnsUtc.UTCDate(Number(verifiedReceipt.userCancellationTimeMillis))
                    : null,
            };

            isDowngradeUser = true;
        } else if (verifiedReceipt.paymentState === undefined) {
            updateSubscription = {
                status: EXPIRED_PURCHASE_STATUS,
            };

            isDowngradeUser = true;
        } else {
            updateSubscription = {
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
            } else {
                updateSubscription = {
                    status: EXPIRED_PURCHASE_STATUS,
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

    async expireUserSubscriptions() {
        try {
            const subscriptions = await this.database.models.UserSubscriptions.findAll({
                where: {
                    status: {
                        [Sequelize.Op.notIn]: [EXPIRED_PURCHASE_STATUS, CANCELLED_PURCHASE_STATUS],
                    },
                    expires_at: {
                        [Sequelize.Op.gt]: dateFns.sub(new dateFnsUtc.UTCDate(), { minutes: 20 }),
                        [Sequelize.Op.lte]: dateFns.sub(new dateFnsUtc.UTCDate(), { minutes: 10 }),
                    },
                },
            });

            await Promise.all(
                subscriptions.map(async (subscription) => {
                    const receipt = JSON.parse(subscription.response);

                    if (subscription.platform === GOOGLE_PAYMENT_PLATFORM) {
                        const verifiedReceipt = await this.inAppPurchase.verifyGooglePurchase({
                            packageName: receipt['verificationData.localVerificationData'].packageName,
                            productId: receipt['verificationData.localVerificationData'].productId,
                            purchaseToken: receipt['verificationData.localVerificationData'].purchaseToken,
                            orderId: receipt['verificationData.localVerificationData'].orderId,
                        });

                        await this._expireGoogleSubscription(subscription, verifiedReceipt);
                    } else if (subscription.platform === APPLE_PAYMENT_PLATFORM) {
                        let latestTransaction;

                        try {
                            [latestTransaction] = await this.inAppPurchase.verifyApplePurchase(receipt['verificationData.localVerificationData']);
                        } catch (error) {
                            /** empty */
                        }

                        latestTransaction = Buffer.from(latestTransaction.split('.')[1], 'base64').toString();

                        try {
                            latestTransaction = JSON.parse(latestTransaction);
                        } catch (error) {
                            /** empty */
                        }

                        await this._expireGoogleSubscription(subscription, latestTransaction);
                    }
                }),
            );
        } catch (error) {
            this.logger.error('Failed to expire user subscriptions', error);

            throw new exceptions.InternalServerError('Failed to expire user subscriptions', error);
        }
    }
}
