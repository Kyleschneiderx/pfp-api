export default class MiscellaneousController {
    constructor({ miscellaneousService }) {
        this.miscellaneousService = miscellaneousService;
    }

    async handleGetPrivacyPolicyRoute(req, res) {
        return res.json(await this.miscellaneousService.getPrivacyPolicy());
    }

    async handleGetAboutAppRoute(req, res) {
        return res.json(await this.miscellaneousService.getAboutApp());
    }

    async handleGetSurveyQuestionsRoute(req, res) {
        return res.json(await this.miscellaneousService.getSurveyQuestions());
    }
}
