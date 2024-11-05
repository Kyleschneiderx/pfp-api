export default class InAppPurchase {
    constructor({ logger, apple: { appleAppStoreClient, appleAppStoreServerLib } }) {
        this.logger = logger;
        this.appleAppStoreClient = appleAppStoreClient;
        this.appleAppStoreServerLib = appleAppStoreServerLib;
    }

    async verifyApplePurchase(data) {
        if (this.appleAppStoreServerLib === undefined && this.appleAppStoreClient === undefined) return;

        try {
            const receiptUtil = new this.appleAppStoreServerLib.ReceiptUtility();
            const transactionId = receiptUtil.extractTransactionIdFromAppReceipt(data.receipt);
            if (transactionId != null) {
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
            }
        } catch (error) {
            this.logger.error('Failed to verify apple purchase.', error);
        }
    }

    async verifyGooglePurchase() {}
}
