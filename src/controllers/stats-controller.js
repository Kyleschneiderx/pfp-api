export default class StatsController {
    constructor({ loggerService, statsService }) {
        this.loggerService = loggerService;
        this.statsService = statsService;
    }

    async handleGetUserSummaryRoute(req, res) {
        return res.json(
            await this.statsService.getUserSummary({
                period: req.query.period,
                dateFrom: req.query.date_from,
                dateTo: req.query.date_to,
            }),
        );
    }

    async handlePageTrackingStatsRoute(req, res) {
        const stats = await this.statsService.getPageVisitStats({
            dateFrom: req.query.date_from,
            dateTo: req.query.date_to,
        });

        return res.json(stats);
    }

    async handleAiMessageStatsRoute(req, res) {
        const stats = await this.statsService.getAiUserMessage({
            dateFrom: req.query.date_from,
            dateTo: req.query.date_to,
        });

        return res.json(stats);
    }
}
