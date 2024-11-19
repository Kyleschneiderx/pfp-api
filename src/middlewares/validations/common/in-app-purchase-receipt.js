import { body } from 'express-validator';
import { GOOGLE_PAY_FREE_TRIAL, GOOGLE_PAY_PAYMENT_RECEIVED, GOOGLE_PAYMENT_PLATFORM } from '../../../constants/index.js';

export default ({ inAppPurchase }) =>
    body('receipt')
        .exists({ values: 'falsy' })
        .withMessage('Receipt is required.')
        .customSanitizer((value) => {
            try {
                value['verificationData.localVerificationData'] = JSON.parse(value?.['verificationData.localVerificationData']);
            } catch (error) {
                /** empty */
                console.log(error);
            }

            return value;
        })
        .custom(async (value, { req }) => {
            if (value['verificationData.source'] === GOOGLE_PAYMENT_PLATFORM) {
                const verifiedReceipt = await inAppPurchase.verifyGooglePurchase({
                    packageName: value['verificationData.localVerificationData'].packageName,
                    productId: value['verificationData.localVerificationData'].productId,
                    purchaseToken: value['verificationData.localVerificationData'].purchaseToken,
                    orderId: value['verificationData.localVerificationData'].orderId,
                });

                console.log(verifiedReceipt);

                const googlePayAllowedPaymentState = [GOOGLE_PAY_FREE_TRIAL, GOOGLE_PAY_PAYMENT_RECEIVED];

                if (!googlePayAllowedPaymentState.includes(verifiedReceipt.paymentState)) {
                    throw new Error('Invalid payment status');
                }

                req.body.receipt.finalizedData = {
                    purchaseDate: verifiedReceipt.startTimeMillis,
                    expireDate: verifiedReceipt.expiryTimeMillis,
                    amount: verifiedReceipt.priceAmountMicros / 1000000,
                    currency: verifiedReceipt.priceCurrencyCode,
                    status: value.status,
                    reference: value['verificationData.localVerificationData'].orderId,
                    platform: value['verificationData.source'],
                };
            }

            return true;
        });
