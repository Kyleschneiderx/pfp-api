import { SYSTEM_AUDITS } from '../constants/index.js';

export default class ChatAiController {
    constructor({ chatAiService, loggerService }) {
        this.chatAiService = chatAiService;
        this.loggerService = loggerService;
    }

    async handlePostMessage(req, res) {
        const response = await this.chatAiService.postMessageToAiCoach({
            userId: req.auth.user_id,
            message: req.body.message,
        });

        return res.status(201).json({
            data: response,
        });
    }
}
