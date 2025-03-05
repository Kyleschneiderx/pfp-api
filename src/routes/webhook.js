import express from 'express';

export default ({ miscellaneousController }) => {
    const router = express.Router();

    router.post('/revenuecat', miscellaneousController.handleRevenuecatWebhookRoute.bind(miscellaneousController));

    return router;
};
