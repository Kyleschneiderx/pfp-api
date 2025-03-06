import { body } from 'express-validator';

export default ({ miscellaneousService }) =>
    body('reference')
        .exists({ value: 'falsy' })
        .withMessage('Reference is required.')
        .custom(async (value, { req }) => {
            try {
                const existingPurchaseTransaction = await miscellaneousService.getPaymentByOriginalReference(value);

                if (existingPurchaseTransaction && existingPurchaseTransaction.user_id !== req.auth.user_id) {
                    throw new Error('Transaction already exist.');
                }
            } catch (error) {
                throw new Error('Failed to verify subscription.', { cause: error });
            }

            return true;
        });
