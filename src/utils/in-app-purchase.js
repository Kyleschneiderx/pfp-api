export default class InAppPurchase {
    constructor({ logger, apple: { appleAppStoreClient, appleAppStoreServerLib }, google: { googleAuthClient, googleApis } }) {
        this.logger = logger;
        this.appleAppStoreClient = appleAppStoreClient;
        this.appleAppStoreServerLib = appleAppStoreServerLib;
        this.googleAuthClient = googleAuthClient;
        this.googleApis = googleApis;
    }

    async verifyApplePurchase(data) {
        if (this.appleAppStoreServerLib === undefined && this.appleAppStoreClient === undefined)
            throw new Error('Apple app store server lib and app store client is required.');

        try {
            const receiptUtil = new this.appleAppStoreServerLib.ReceiptUtility();

            const transactionId = receiptUtil.extractTransactionIdFromAppReceipt(data.receipt);

            if (transactionId === null) return null;

            const transactionHistoryRequest = {
                sort: this.appleAppStoreServerLib.DESCENDING,
                revoked: false,
                productTypes: [this.appleAppStoreServerLib.ProductType.CONSUMABLE],
            };

            let response = null;

            let transactions = [];

            do {
                const revisionToken = response !== null && response.revision !== null ? response.revision : null;

                response = await this.appleAppStoreClient.getTransactionHistory(transactionId, revisionToken, transactionHistoryRequest);

                if (response.signedTransactions) {
                    transactions = transactions.concat(response.signedTransactions);
                }
            } while (response.hasMore);

            console.log(transactions);

            return transactions;
        } catch (error) {
            this.logger.error('Failed to verify apple purchase.', error);

            throw new Error('Failed to verify apple purchase.', { cause: error });
        }
    }

    async verifyGooglePurchase(data) {
        if (this.googleApis === undefined && this.googleAuthClient === undefined)
            throw new Error('Google apis module and google auth client is required.');

        this.googleApis.google.options({ auth: this.googleAuthClient });

        try {
            // packageName,productId,token you can get from request sent from android
            const purchaseResponse = await this.googleApis.google
                .androidpublisher({
                    version: 'v3',
                })
                .purchases.products.get({
                    packageName: data.packageName,
                    productId: data.productId,
                    token: data.purchaseToken,
                });

            if (purchaseResponse.data.purchaseState !== 0) {
                throw new Error('Purchase is either pending or cancelled');
            }

            if (purchaseResponse.data.consumptionState !== 0) {
                throw new Error('Purchase is already consumed');
            }

            if (purchaseResponse.data.orderId !== data.orderId) {
                throw new Error('Invalid order id');
            }

            return purchaseResponse;
        } catch (error) {
            this.logger.error('Failed to verify google purchase.', error);

            throw new Error('Failed to verify google purchase.', { cause: error });
        }
    }
}
