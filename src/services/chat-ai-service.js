import { get_encoding } from '@dqbd/tiktoken';
import { AI_CHAT, AI_ROLES, FIRESTORE_COLLECTIONS } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class ChatAiService {
    constructor({ logger, database, openAiChat, fireStore }) {
        this.database = database;
        this.logger = logger;
        this.openAiChat = openAiChat;
        this.fireStore = fireStore;
    }

    _estimateToken(data) {
        let tokens = 4;

        const encoding = get_encoding('cl100k_base');

        tokens += encoding.encode(data.role).length;

        tokens += encoding.encode(data.content).length;

        if (data.name) {
            tokens += encoding.encode(data.name).length;
        }

        encoding.free();

        return tokens;
    }

    /**
     * Post message to AI model provider
     *
     * @param {object} data
     * @param {number} data.userId User id
     * @param {string} data.message Message from user
     *
     * @throws {InternalServerError} If failed to post message
     */
    async postMessageToAiCoach(data) {
        const timestamp = Date.now();

        try {
            const [aiSettings, userProfile] = await Promise.all([
                this.database.models.AiChatSettings.findAll({}),
                this.database.models.UserProfiles.findOne({
                    where: {
                        user_id: data.userId,
                    },
                }),
            ]);

            const aiSettingMap = {};

            aiSettings.forEach((setting) => {
                aiSettingMap[setting.key] = setting.value;
            });

            const messages = await this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc(String(data.userId))
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .orderBy('updatedAt', 'desc')
                .orderBy('__name__', 'desc')
                .limit(50)
                .get();

            let estimatedTokens = 0;

            if (!messages.docs.length) {
                await this.fireStore.collection(FIRESTORE_COLLECTIONS.ROOMS_AI).doc(String(data.userId)).set({
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });

                const coachWelcomeMessageToken = this._estimateToken({ role: AI_ROLES.ASSISTANT, content: AI_CHAT.WELCOME_COACH });

                estimatedTokens += coachWelcomeMessageToken;

                this.fireStore
                    .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                    .doc(String(data.userId))
                    .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                    .add({
                        name: AI_CHAT.COACH_NAME,
                        message: AI_CHAT.WELCOME_COACH,
                        senderId: null,
                        role: AI_ROLES.ASSISTANT,
                        tokenCount: coachWelcomeMessageToken,
                        files: [],
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    });
            }

            const newMessageToken = this._estimateToken({ role: AI_ROLES.USER, content: data.message });

            estimatedTokens += newMessageToken;

            this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc(String(data.userId))
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .add({
                    name: userProfile.name,
                    message: data.message,
                    senderId: data.userId,
                    role: AI_ROLES.USER,
                    tokenCount: newMessageToken,
                    files: [],
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });

            const promptMessage = {
                role: AI_ROLES.SYSTEM,
                content: aiSettingMap.prompt,
            };

            estimatedTokens += this._estimateToken(promptMessage);

            const history = [];

            if (messages.docs.length) {
                for (let i = 0; i < messages.docs.length; i += 1) {
                    const message = messages.docs[i].data();

                    if (estimatedTokens + message.tokenCount >= Number(aiSettings.max_tokens)) break;

                    estimatedTokens += message.tokenCount;

                    history.push({ role: message.role, content: message.message });
                }
            }

            const conversation = [
                promptMessage,
                ...(messages.docs ? history.reverse() : [{ role: AI_ROLES.ASSISTANT, content: AI_CHAT.WELCOME_COACH }]),
            ];

            const response = await this.openAiChat(
                [
                    ...conversation,
                    {
                        role: AI_ROLES.USER,
                        content: data.message,
                    },
                ],
                {
                    user: String(data.userId),
                },
            );

            const aiResponse = {
                name: AI_CHAT.COACH_NAME,
                message: response.choices[0]?.message?.content,
                senderId: null,
                role: AI_ROLES.ASSISTANT,
                tokenCount: response.usage.completion_tokens,
                files: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc(String(data.userId))
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .add(aiResponse);

            return aiResponse;
        } catch (error) {
            this.logger.error('Failed to post message.', error);

            throw new exceptions.InternalServerError('Failed to post message.', error);
        }
    }

    async getAiCoachPrompt() {
        try {
            return this.database.models.AiChatSettings.findOne({ where: { key: 'prompt' } });
        } catch (error) {
            this.logger.error('Failed to update prompt.', error);

            throw new exceptions.InternalServerError('Failed to update prompt.', error);
        }
    }

    async updateAiCoachPrompt(prompt) {
        try {
            return this.database.models.AiChatSettings.update(
                {
                    value: prompt,
                },
                {
                    where: {
                        key: 'prompt',
                    },
                },
            );
        } catch (error) {
            this.logger.error('Failed to update prompt.', error);

            throw new exceptions.InternalServerError('Failed to update prompt.', error);
        }
    }

    async resetDemoConversation() {
        try {
            const messages = await this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc('3')
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .get();

            messages.docs.forEach((message) => {
                message.ref.delete();
            });

            return this.fireStore.collection(FIRESTORE_COLLECTIONS.ROOMS_AI).doc('3').delete();
        } catch (error) {
            this.logger.error('Failed to reset conversation.', error);

            throw new exceptions.InternalServerError('Failed to reset conversation.', error);
        }
    }

    async getDemoConversation() {
        try {
            const messages = await this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc('3')
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .orderBy('updatedAt', 'asc')
                .orderBy('__name__', 'asc')
                .get();

            return messages.docs.map((message) => message.data());
        } catch (error) {
            this.logger.error('Failed to get conversation.', error);

            throw new exceptions.InternalServerError('Failed to get conversation.', error);
        }
    }
}
