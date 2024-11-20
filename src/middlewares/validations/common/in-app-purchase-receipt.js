import { body } from 'express-validator';
import { APPLE_PAYMENT_PLATFORM, GOOGLE_PAY_FREE_TRIAL, GOOGLE_PAY_PAYMENT_RECEIVED, GOOGLE_PAYMENT_PLATFORM } from '../../../constants/index.js';

export default ({ inAppPurchase }) =>
    body('receipt')
        .exists({ values: 'falsy' })
        .withMessage('Receipt is required.')
        .customSanitizer((value) => {
            try {
                value['verificationData.localVerificationData'] = JSON.parse(value?.['verificationData.localVerificationData']);
            } catch (error) {
                /** empty */
            }

            return value;
        })
        .custom(async (value, { req }) => {
            if (value['verificationData.source'] === GOOGLE_PAYMENT_PLATFORM) {
                let verifiedReceipt;
                try {
                    verifiedReceipt = await inAppPurchase.verifyGooglePurchase({
                        packageName: value['verificationData.localVerificationData'].packageName,
                        productId: value['verificationData.localVerificationData'].productId,
                        purchaseToken: value['verificationData.localVerificationData'].purchaseToken,
                        orderId: value['verificationData.localVerificationData'].orderId,
                    });
                } catch (error) {
                    throw new Error('Failed to verify purchase receipt.', { cause: error });
                }

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
                    originalReference: null,
                    platform: value['verificationData.source'],
                    productId: value.productID,
                };
            } else if (value['verificationData.source'] === APPLE_PAYMENT_PLATFORM) {
                // let verifiedReceipt;
                // try {
                //     verifiedReceipt = await inAppPurchase.verifyApplePurchase(value['verificationData.localVerificationData']);
                //     if (!verifiedReceipt) {
                //         throw new Error('No transaction available.');
                //     }
                // } catch (error) {
                //     throw new Error('Failed to verify purchase receipt.', { cause: error });
                // }

                // const latestTransaction = verifiedReceipt[0];

                req.body.receipt.finalizedData = {
                    // purchaseDate: latestTransaction.purchaseDate,
                    // expireDate: latestTransaction.expiresDate,
                    // amount: latestTransaction.price / 1000,
                    // currency: latestTransaction.currency,
                    status: value.status,
                    // reference: latestTransaction.transactionId,
                    // originalReference: latestTransaction.originalTransactionId,
                    platform: value['verificationData.source'],
                    productId: value.productID,
                };
            } else {
                throw new Error('Invalid payment platform.');
            }

            return true;
        });
