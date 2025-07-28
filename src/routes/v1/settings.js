import express from 'express';

export default ({ verifyAdmin, settingsController }) => {
    const router = express.Router();

    router.use(verifyAdmin);

    router.get('/ai-coach', settingsController.handleGetAiCoachSettingsRoute.bind(settingsController));

    router.put('/ai-coach', settingsController.handleUpdateAiCoachSettingsRoute.bind(settingsController));

    return router;
};
