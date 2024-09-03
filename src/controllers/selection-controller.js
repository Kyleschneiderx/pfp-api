export default class SelectionController {
    constructor({ selectionService }) {
        this.selectionService = selectionService;
    }

    async handleSelectionsRoute(req, res) {
        return res.json({
            data: await this.selectionService.getSelections(req.query),
        });
    }
}
