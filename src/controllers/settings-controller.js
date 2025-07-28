export default class SettingsController {
    constructor({ settingsService }) {
        this.settingsService = settingsService;
    }

    async handleGetAiCoachSettingsRoute(req, res) {
        return res.json({
            data: await this.settingsService.getAiCoachSettings(),
        });
    }

    async handleUpdateAiCoachSettingsRoute(req, res) {
        const settings = await this.settingsService.updateAiCoachSettings(req.body);

        return res.json(settings);
    }
}
