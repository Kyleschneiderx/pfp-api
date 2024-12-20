import { body } from 'express-validator';
import { APPLE_PAYMENT_PLATFORM, GOOGLE_PAY_FREE_TRIAL, GOOGLE_PAY_PAYMENT_RECEIVED, GOOGLE_PAYMENT_PLATFORM } from '../../../constants/index.js';

export default ({ inAppPurchase, miscellaneousService }) => {
    const validateGooglePurchase = async (value, { req }) => {
        let verifiedReceipt;
        try {
            verifiedReceipt = await inAppPurchase.verifyGooglePurchase({
                packageName: value['verificationData.localVerificationData'].packageName,
                productId: value['verificationData.localVerificationData'].productId,
                purchaseToken: value['verificationData.localVerificationData'].purchaseToken,
            });
        } catch (error) {
            throw new Error('Failed to verify purchase receipt.', { cause: error });
        }

        const googlePayAllowedPaymentState = [GOOGLE_PAY_FREE_TRIAL, GOOGLE_PAY_PAYMENT_RECEIVED];

        if (!googlePayAllowedPaymentState.includes(verifiedReceipt.paymentState)) {
            throw new Error('Invalid payment status');
        }

        const existingPurchaseTransaction = await miscellaneousService.getPaymentByOrignalReference(
            value['verificationData.localVerificationData'].orderId,
        );

        if (existingPurchaseTransaction && existingPurchaseTransaction.user_id !== req.auth.user_id) {
            throw new Error('Transaction already exist.');
        }

        return {
            purchaseDate: verifiedReceipt.startTimeMillis,
            expireDate: verifiedReceipt.expiryTimeMillis,
            amount: verifiedReceipt.priceAmountMicros / 1000000,
            currency: verifiedReceipt.priceCurrencyCode,
            status: value.status,
            reference: value['verificationData.localVerificationData'].orderId,
            originalReference: value['verificationData.localVerificationData'].orderId,
            platform: value['verificationData.source'],
            productId: value.productID,
        };
    };

    const validateApplePurchase = async (value, { req }) => {
        let verifiedReceipt;
        try {
            verifiedReceipt = await inAppPurchase.verifyApplePurchase(value['verificationData.localVerificationData']);
            if (!verifiedReceipt) {
                throw new Error('No transaction available.');
            }
        } catch (error) {
            throw new Error('Failed to verify purchase receipt.', { cause: error });
        }

        const latestTransaction = verifiedReceipt[0];

        const existingPurchaseTransaction = await miscellaneousService.getPaymentByOrignalReference(latestTransaction.originalTransactionId);

        if (existingPurchaseTransaction && existingPurchaseTransaction.user_id !== req.auth.user_id) {
            throw new Error('Transaction already exist.');
        }

        return {
            purchaseDate: latestTransaction.purchaseDate,
            expireDate: latestTransaction.expiresDate,
            amount: latestTransaction.price / 1000,
            currency: latestTransaction.currency,
            status: value.status,
            reference: latestTransaction.transactionId,
            originalReference: latestTransaction.originalTransactionId,
            platform: value['verificationData.source'],
            productId: value.productID,
        };
    };

    return body('receipt')
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
                try {
                    req.body.receipt.finalizedData = await validateGooglePurchase(value, { req: req });
                } catch (error) {
                    throw new Error(error.message);
                }
            } else if (value['verificationData.source'] === APPLE_PAYMENT_PLATFORM) {
                try {
                    req.body.receipt.finalizedData = await validateApplePurchase(value, { req: req });
                } catch (error) {
                    throw new Error(error.message);
                }
            } else {
                throw new Error('Invalid payment platform.');
            }

            return true;
        });
};
