import express from 'express';

export default ({ verifyAdmin, statsController }) => {
    const router = express.Router();

    router.use(verifyAdmin);

    router.get('/user-summary', [verifyAdmin], statsController.handleGetUserSummaryRoute.bind(statsController));

    router.get('/page-tracking', statsController.handlePageTrackingStatsRoute.bind(statsController));

    router.get('/user-coach-prompt', statsController.handleAiMessageStatsRoute.bind(statsController));

    return router;
};
