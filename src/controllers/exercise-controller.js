import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS } from '../constants/index.js';

export default class ExerciseController {
    constructor({ exerciseService }) {
        this.exerciseService = exerciseService;
    }

    async handleCreateExerciseRoute(req, res) {
        const exercise = await this.exerciseService.createExercise({
            name: req.body.name,
            categoryId: req.body.category_id,
            sets: req.body.sets,
            reps: req.body.reps,
            hold: req.body.hold,
            description: req.body.description,
            howTo: req.body.how_to,
            photo: req.files?.photo,
            video: req.files?.video,
            audio: req.files?.audio,
        });
        return res.status(201).json(exercise);
    }

    async handleGetExercisesRoute(req, res) {
        const list = await this.exerciseService.getExercises({
            id: req.query.id,
            name: req.query.name,
            categoryId: req.query.category_id,
            setsFrom: req.query.sets_from,
            setsTo: req.query.sets_to,
            repsFrom: req.query.reps_from,
            repsTo: req.query.reps_to,
            sort: req.query.sort,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });
        return res.json(list);
    }

    async handleRemoveExerciseRoute(req, res) {
        await this.exerciseService.removeExercise(req.params.id);

        return res.status(204).send();
    }
}
