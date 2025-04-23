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

    async handleCreateContentCategoryRoute(req, res) {
        const category = await this.selectionService.createContentCategory({
            description: req.body.description,
            questionId: req.body.question_id,
        });

        return res.status(201).json(category);
    }

    async handleUpdateContentCategoryRoute(req, res) {
        const category = await this.selectionService.updateContentCategory(req.params.id, {
            description: req.body.description,
            questionId: req.body.question_id,
        });

        return res.json(category);
    }

    async handleRemoveContentCategoryRoute(req, res) {
        await this.selectionService.removeContentCategory(req.params.id);

        return res.json({ msg: 'Successfully removed category.' });
    }
}
