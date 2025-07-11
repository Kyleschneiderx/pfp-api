import express from 'express';

export default ({ chatAiController }) => {
    const router = express.Router();

    router.post('/', chatAiController.handlePostMessage.bind(chatAiController));

    return router;
};
