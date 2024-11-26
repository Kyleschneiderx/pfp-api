export default class InAppPurchase {
    constructor({ logger, apple: { appleAppStoreClient, appleAppStoreServerLib } = {}, google: { googleAuthClient, googleApis } = {} }) {
        this.logger = logger;
        this.appleAppStoreClient = appleAppStoreClient;
        this.appleAppStoreServerLib = appleAppStoreServerLib;
        this.googleAuthClient = googleAuthClient;
        this.googleApis = googleApis;
    }

    async verifyApplePurchase(receipt) {
        if (this.appleAppStoreServerLib === undefined && this.appleAppStoreClient === undefined)
            throw new Error('Apple app store server lib and app store client is required.');

        try {
            const receiptUtil = new this.appleAppStoreServerLib.ReceiptUtility();

            const transactionId = receiptUtil.extractTransactionIdFromAppReceipt(receipt);

            if (transactionId === null) return null;

            let response = null;

            let transactions = [];

            do {
                const revisionToken = response !== null && response.revision !== null ? response.revision : null;

                // eslint-disable-next-line no-await-in-loop
                response = await this.appleAppStoreClient.getTransactionHistory(transactionId, revisionToken, {
                    sort: this.appleAppStoreServerLib.Order.DESCENDING,
                    revoked: false,
                    productTypes: [this.appleAppStoreServerLib.ProductType.AUTO_RENEWABLE],
                });

                if (response.signedTransactions) {
                    response.signedTransactions = response.signedTransactions.map((tx) => {
                        try {
                            tx = JSON.parse(Buffer.from(tx.split('.')[1], 'base64').toString());
                        } catch (error) {
                            /** empty */
                        }

                        return tx;
                    });
                    transactions = transactions.concat(response.signedTransactions);
                }
            } while (response.hasMore);

            return transactions;
        } catch (error) {
            this.logger.error('Failed to verify apple purchase.', error);

            throw new Error('Failed to verify apple purchase.', { cause: error });
        }
    }

    /**
     * Validate google purchase receipt
     *
     * @param {object} data
     * @param {string} data.packageName Product name
     * @param {string} data.productId Product id
     * @param {string} data.purchaseToken Purchase token
     * @returns
     */
    async verifyGooglePurchase(data) {
        if (this.googleApis === undefined && this.googleAuthClient === undefined)
            throw new Error('Google apis module and google auth client is required.');

        this.googleApis.google.options({ auth: this.googleAuthClient });

        try {
            const purchaseResponse = await this.googleApis.google.androidpublisher({ version: 'v3' }).purchases.subscriptions.get({
                packageName: data.packageName,
                subscriptionId: data.productId,
                token: data.purchaseToken,
            });

            return purchaseResponse.data;
        } catch (error) {
            this.logger.error('Failed to verify google purchase.', error);

            console.log(error.response.data.error);

            throw new Error('Failed to verify google purchase.', { cause: error });
        }
    }

    async cancelGooglePurchase(data) {
        if (this.googleApis === undefined && this.googleAuthClient === undefined)
            throw new Error('Google apis module and google auth client is required.');

        this.googleApis.google.options({ auth: this.googleAuthClient });

        try {
            const cancelResponse = await this.googleApis.google.androidpublisher({ version: 'v3' }).purchases.subscriptions.cancel({
                packageName: data.packageName,
                subscriptionId: data.productId,
                token: data.purchaseToken,
            });

            return cancelResponse.data;
        } catch (error) {
            this.logger.error('Failed to cancel google purchase.', error);

            throw new Error('Failed to cancel google purchase.', { cause: error });
        }
    }
}
