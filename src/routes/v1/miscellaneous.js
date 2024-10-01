import express from 'express';

export default ({ miscellaneousController }) => {
    const router = express.Router();

    router.get('/privacy-policy', miscellaneousController.handleGetPrivacyPolicyRoute.bind(miscellaneousController));

    router.get('/about-app', miscellaneousController.handleGetAboutAppRoute.bind(miscellaneousController));

    return router;
};
