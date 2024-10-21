import { body } from 'express-validator';

export default ({ selectionService }) =>
    body('package_id')
        .exists({ values: 'falsy' })
        .withMessage('Subscription package id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            const subscriptionPackage = await selectionService.getSubscriptionPackageById(value);

            if (!subscriptionPackage) {
                throw new Error('Subscription package does not exist.');
            }

            subscriptionPackage.dataValues.price /= 100;

            if (subscriptionPackage.dataValues.discounted_price) {
                subscriptionPackage.dataValues.discounted_price /= 100;
            }

            req.subscriptionPackage = subscriptionPackage;

            return true;
        });
