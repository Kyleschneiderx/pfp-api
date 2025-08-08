import OpenAI from 'openai';
import config from '../../configs/open-router.js';

const openai = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
});

export default openai;

export const openAiChat = async (messages, options) => {
    options = {
        ...(config.model.includes?.(',') ? { models: config.model.split(',') } : { model: config.model }),
        ...options,
        temperature: 1,
        max_completion_tokens: 20000,
    };

    return openai.chat.completions.create({
        messages: messages,
        ...options,
    });
};
