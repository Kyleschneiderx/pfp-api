import { check } from 'express-validator';

export default ({ revenuecat }) =>
    check('purchase').custom(async (value, { req }) => {
        try {
            const customerSubscriptions = await revenuecat.getCustomerSubscriptions(req.auth.user_id);

            const subscription = customerSubscriptions.items[0];

            const product = await revenuecat.getProduct(subscription.product_id);

            if (!subscription.gives_access) {
                throw new Error('Invalid subscription.');
            }

            req.body.subscription = subscription;

            req.body.receipt = {
                expireDate: subscription.current_period_ends_at,
                purchaseDate: subscription.starts_at,
                amount: subscription.total_revenue_in_usd.commission,
                currency: subscription.total_revenue_in_usd.currency,
                status: subscription.status,
                reference: subscription.store_subscription_identifier,
                originalReference: subscription.store_subscription_identifier,
                platform: subscription.store,
                productId: product.store_identifier.includes(':') ? product.store_identifier.split(':')[0] : product.store_identifier,
            };
        } catch (error) {
            throw new Error('Failed to verify subscription.', { cause: error });
        }

        return true;
    });
