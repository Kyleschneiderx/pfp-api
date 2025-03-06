import axios from 'axios';
import config from '../../configs/revenuecat.js';

export const ENVIRONMENTS = {
    SANDBOX: 'sndbx',
    STAGING: 'sndbx',
    PRODUCTION: 'prd',
    TEMP: '',
};

export const WEBHOOK_EVENTS = {
    INITIAL_PURCHASE: 'INITIAL_PURCHASE',
    RENEWAL: 'RENEWAL',
    CANCELLATION: 'CANCELLATION',
    UNCANCELLATION: 'UNCANCELLATION',
    NON_RENEWING_PURCHASE: 'NON_RENEWING_PURCHASE',
    SUBSCRIPTION_PAUSED: 'SUBSCRIPTION_PAUSED',
    BILLING_ISSUE: 'BILLING_ISSUE',
    EXPIRATION: 'EXPIRATION',
    TRANSFER: 'TRANSFER',
    PRODUCT_CHANGE: 'PRODUCT_CHANGE',
    SUBSCRIPTION_EXTENDED: 'SUBSCRIPTION_EXTENDED',
};

export const CANCELLATION_REASON = {
    UNSUBSCRIBE: 'UNSUBSCRIBE',
    BILLING_ERROR: 'BILLING_ERROR',
    DEVELOPER_INITIATED: 'DEVELOPER_INITIATED',
    PRICE_INCREASE: 'PRICE_INCREASE',
    CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
    UNKNOWN: 'UNKNOWN',
    SUBSCRIPTION_PAUSED: 'SUBSCRIPTION_PAUSED',
};

export class RevenueCat {
    baseUrl = 'https://api.revenuecat.com/v2';

    projectId = null;

    apiKey = null;

    environment = null;

    constructor({ apiKey, environment, projectId = null }) {
        this.apiKey = apiKey;

        this.projectId = projectId;

        if (ENVIRONMENTS[environment.toUpperCase()] === undefined && environment.toUpperCase() !== 'TEMP') {
            throw new Error('[Client] Invalid environment.');
        }

        this.environment = environment.toUpperCase();
    }

    async _client(method, url, payload) {
        try {
            return axios.request({
                baseURL: this.baseUrl,
                url: url,
                method: method,
                params: method.toUpperCase() === 'GET' ? payload : null,
                data: method.toUpperCase() === 'GET' ? null : payload,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
        } catch (error) {
            if (error.response) {
                return error.response;
            }

            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    _environmentalizeCustomerId(customerId) {
        return `${ENVIRONMENTS[this.environment]}${customerId}`;
    }

    parseCustomerId(customerId) {
        return Number(customerId.replace(ENVIRONMENTS[this.environment], ''));
    }

    async getEntitlement(entitlementId) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/entitlements/${entitlementId}`, { expand: 'product' });

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getEntitlements(options = {}) {
        options.expand = 'items.product';
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/entitlements`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getEntitlementProducts(entitlementId, options = {}) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/entitlements/${entitlementId}/products`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getSubscription(subscriptionId) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/subscriptions/${subscriptionId}`);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getSubscriptionEntitlements(subscriptionId, options = {}) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/subscriptions/${subscriptionId}/entitlements`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getPurchases(purchaseId) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/purchases/${purchaseId}`);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getPurchaseEntitlements(purchaseId, options = {}) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/purchases/${purchaseId}/entitlements`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getCustomers(options = {}) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/customers`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getCustomer(customerId, options = {}) {
        customerId = this._environmentalizeCustomerId(customerId);
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/customers/${customerId}`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getCustomerSubscriptions(customerId, options = {}) {
        customerId = this._environmentalizeCustomerId(customerId);

        // options.environment = this.environment.toLowerCase();

        try {
            const response = await this._client('GET', `/projects/${this.projectId}/customers/${customerId}/subscriptions`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getCustomerPurchases(customerId, options = {}) {
        customerId = this._environmentalizeCustomerId(customerId);

        // options.environment = this.environment.toLowerCase();

        try {
            const response = await this._client('GET', `/projects/${this.projectId}/customers/${customerId}/purchases`, options);

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }

    async getProduct(productId) {
        try {
            const response = await this._client('GET', `/projects/${this.projectId}/products/${productId}`, {
                expand: 'app',
            });

            return response.data;
        } catch (error) {
            throw new Error(`[Client] ${error.message}`, { cause: error });
        }
    }
}

export default new RevenueCat({
    apiKey: config.apiKey,
    projectId: config.projectId,
    environment: config.environment,
});
