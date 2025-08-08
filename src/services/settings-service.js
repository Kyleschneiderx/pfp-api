import { InternalServerError } from 'openai';
import * as exceptions from '../exceptions/index.js';

export default class SettingsService {
    constructor({ logger, database, helper }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
    }

    /**
     * Get settings for ai coach chat
     *
     * @returns {{key: any}}
     * @throws {InternalServerError} If failed to get ai coach settings
     */
    async getAiCoachSettings() {
        try {
            const settings = await this.database.models.AiChatSettings.findAll({});

            const settingsMap = {};

            settings.forEach((setting) => {
                settingsMap[setting.key] = setting.value;
            });

            return settingsMap;
        } catch (error) {
            this.logger.error('Failed to get ai coach settings.', error);

            throw new exceptions.InternalServerError('Failed to get ai coach settings.', error);
        }
    }

    /**
     * Update ai coach settings
     *
     * @param {object} data
     *
     * @return {AiChatSettings[]}
     * @throws {InternalServerError} If failed to update ai coach settings
     */
    async updateAiCoachSettings(data) {
        try {
            let settings = await this.database.models.AiChatSettings.findAll({ raw: true, where: { key: Object.keys(data) } });

            settings = settings.map((setting) => {
                setting.value = data[setting.key] ?? setting.value;

                return setting;
            });

            return this.database.models.AiChatSettings.bulkCreate(settings, { updateOnDuplicate: ['value'] });
        } catch (error) {
            this.logger.error('Failed to update ai coach settings.', error);

            throw new exceptions.InternalServerError('Failed to update ai coach settings.', error);
        }
    }
}
