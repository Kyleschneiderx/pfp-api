import { get_encoding } from '@dqbd/tiktoken';
import { AI_CHAT, AI_CHAT_FREE_LIMIT, AI_ROLES, FIRESTORE_COLLECTIONS, PREMIUM_USER_TYPE_ID } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class ChatAiService {
    constructor({ logger, database, openAiChat, fireStore, helper }) {
        this.database = database;
        this.logger = logger;
        this.openAiChat = openAiChat;
        this.fireStore = fireStore;
        this.helper = helper;
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

    _pfdiResultToPrompt(pfdiResults) {
        if (!pfdiResults) return null;

        const severityMap = [
            {
                min: 67,
                severity: 'Severe',
            },
            {
                min: 34,
                severity: 'Moderate',
            },
            {
                min: 1,
                severity: 'Mild',
            },
            {
                min: 0,
                severity: 'Normal',
            },
        ];

        let prompt = `FYI: Here’s the latest PFDI-20 summary for this user, grouped by symptoms:\n\n`;

        pfdiResults.forEach((result, index) => {
            const questions = result.group.question_ids.map((question) => `Q${question.question_id}`);
            const severity = severityMap.find((s) => result.avg_score >= s.min);
            prompt += `${index + 1}. **${result.group.description}\n - Score: ${result.avg_score}/100 (${severity.severity})\n - Related Questions: ${questions.join(',')}\n\n`;
        });

        prompt += 'Please use these results when explaining, suggesting gentle exercises, or following up.';

        return prompt;
    }

    _surveyResultToPrompt(pfdiResults) {
        if (!pfdiResults) return null;

        let prompt = `Here’s {user_name} PFDI-20 results:\n\n`;

        pfdiResults.forEach((result, index) => {
            prompt += `${index + 1}. ${result.question.question}\n Answer: ${result.yes_no === 'yes' ? result.if_yes_how_much_bother : 'no'}\n\n`;
        });

        prompt += 'Please use these results when explaining, suggesting gentle exercises, or following up.';

        return prompt;
    }

    /**
     * Create room and initial message for AI coach
     * @param {number} userId
     *
     * @throws {InternalServerError} If failed to post message
     */
    async initiateAiCoach(userId) {
        const timestamp = Date.now();

        try {
            const [aiSettings, userProfile, userSurvey] = await Promise.all([
                this.database.models.AiChatSettings.findAll({}),
                this.database.models.UserProfiles.findOne({
                    where: {
                        user_id: userId,
                    },
                }),
                this.database.models.UserSurveyQuestionAnswers.scope('withQuestion').findAll({
                    where: { user_id: userId },
                    order: [['question_id', 'ASC']],
                }),
            ]);

            const aiSettingMap = {};

            aiSettings.forEach((setting) => {
                aiSettingMap[setting.key] = setting.value;
            });

            const messages = await this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc(String(userId))
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .get();

            await Promise.all(messages.docs.map((message) => message.ref.delete()));

            await this.fireStore.collection(FIRESTORE_COLLECTIONS.ROOMS_AI).doc(String(userId)).set({
                createdAt: timestamp,
                updatedAt: timestamp,
            });

            const coachWelcomeMessageToken = this._estimateToken({ role: AI_ROLES.ASSISTANT, content: AI_CHAT.WELCOME_COACH });

            this.fireStore.collection(FIRESTORE_COLLECTIONS.ROOMS_AI).doc(String(userId)).collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES).add({
                name: AI_CHAT.COACH_NAME,
                message: AI_CHAT.WELCOME_COACH,
                senderId: null,
                role: AI_ROLES.ASSISTANT,
                tokenCount: coachWelcomeMessageToken,
                files: [],
                createdAt: timestamp,
                updatedAt: timestamp,
            });

            const promptMessage = {
                role: AI_ROLES.SYSTEM,
                content: aiSettingMap.prompt,
            };

            const pfdiPrompt = this.helper.replacer(this._surveyResultToPrompt(userSurvey), { user_name: userProfile.name });

            const pfdiPromptMessage = {
                role: AI_ROLES.USER,
                content: pfdiPrompt,
            };

            const conversation = [promptMessage, pfdiPromptMessage];

            const response = await this.openAiChat(
                [
                    ...conversation,
                    {
                        role: AI_ROLES.USER,
                        content: `
                            Based on the PFDI-20 result provided, list 5–10 natural questions a
                            person might be curious about or want to ask next.

                            Be human, empathetic, and avoid clinical language unless it’s explained in a friendly way.
                            Think like a helpful assistant who understands both medical knowledge and real-life concerns.

                            Also start the message something like 'These are the question you might want to ask or curious about:'
                        `,
                    },
                ],
                {
                    user: String(userId),
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
                .doc(String(userId))
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .add(aiResponse);

            return aiResponse;
        } catch (error) {
            this.logger.error('Failed to post message.', error);

            throw new exceptions.InternalServerError('Failed to post message.', error);
        }
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
            const [aiSettings, user, userSurvey] = await Promise.all([
                this.database.models.AiChatSettings.findAll({}),
                this.database.models.Users.scope(['withProfile']).findOne({
                    where: {
                        id: data.userId,
                    },
                }),
                this.database.models.UserSurveyQuestionAnswers.scope('withQuestion').findAll({
                    where: { user_id: data.userId },
                    order: [['question_id', 'ASC']],
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

            const newMessageToken = this._estimateToken({ role: AI_ROLES.USER, content: data.message });

            estimatedTokens += newMessageToken;

            const promptMessage = {
                role: AI_ROLES.SYSTEM,
                content: aiSettingMap.prompt,
            };

            estimatedTokens += this._estimateToken(promptMessage);

            const pfdiPrompt = this.helper.replacer(this._surveyResultToPrompt(userSurvey), { user_name: user.user_profile.name });

            const pfdiPromptMessage = {
                role: AI_ROLES.USER,
                content: pfdiPrompt,
            };

            estimatedTokens += this._estimateToken(pfdiPromptMessage);

            const history = [];
            let userChatCount = 0;
            if (messages.docs.length) {
                for (let i = 0; i < messages.docs.length; i += 1) {
                    const message = messages.docs[i].data();

                    if (estimatedTokens + message.tokenCount >= Number(aiSettings.max_tokens)) break;

                    if (user.type_id !== PREMIUM_USER_TYPE_ID && message.role === AI_ROLES.USER) {
                        userChatCount += 1;
                    }

                    estimatedTokens += message.tokenCount;

                    history.push({ role: message.role, content: message.message });
                }
            }
            if (user.type_id !== PREMIUM_USER_TYPE_ID && userChatCount >= AI_CHAT_FREE_LIMIT) {
                throw new exceptions.BadRequest('You have reached the free limit of chat with AI coach. Please upgrade your account to continue.');
            }

            this.fireStore
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI)
                .doc(String(data.userId))
                .collection(FIRESTORE_COLLECTIONS.ROOMS_AI_MESSAGES)
                .add({
                    name: user.user_profile.name,
                    message: data.message,
                    senderId: data.userId,
                    role: AI_ROLES.USER,
                    tokenCount: newMessageToken,
                    files: [],
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });

            const conversation = [promptMessage, pfdiPromptMessage, ...(messages.docs ? history.reverse() : [])];

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

            if (error instanceof exceptions.BadRequest) throw error;

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
