export default class SelectionController {
    constructor({ selectionService }) {
        this.selectionService = selectionService;
    }

    async handleSelectionsRoute(req, res) {
        return res.json({
            data: await this.selectionService.getSelections(req.query),
        });
    }

    async handleCreateExerciseCategoryRoute(req, res) {
        const category = await this.selectionService.createExerciseCategory({
            value: req.body.name,
        });

        return res.status(201).json(category);
    }

    async handleUpdateExerciseCategoryRoute(req, res) {
        const category = await this.selectionService.updateExerciseCategory(req.params.id, {
            value: req.body.name,
        });

        return res.json(category);
    }

    async handleRemoveExerciseCategoryRoute(req, res) {
        await this.selectionService.removeExerciseCategory(req.params.id);

        return res.json({ msg: 'Successfully removed category.' });
    }
}
