import express from 'express';

export default ({ chatAiController }) => {
    const router = express.Router();

    router.post('/', chatAiController.handlePostMessage.bind(chatAiController));

    if (process.env.APP_ENV !== 'production') {
        router.delete('/user/:id', chatAiController.handleDeleteConversation.bind(chatAiController));
    }

    return router;
};
