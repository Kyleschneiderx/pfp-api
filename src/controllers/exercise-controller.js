import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS, SYSTEM_AUDITS } from '../constants/index.js';

export default class ExerciseController {
    constructor({ exerciseService, loggerService }) {
        this.exerciseService = exerciseService;
        this.loggerService = loggerService;
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
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CREATE_EXERCISE);

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

    async handleGetExerciseRoute(req, res) {
        const exercise = await this.exerciseService.getExercises({
            id: req.params.id,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });
        return res.json(exercise.data[0]);
    }

    async handleRemoveExerciseRoute(req, res) {
        await this.exerciseService.removeExercise(req.params.id);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_EXERCISE);

        return res.json({ msg: 'Successfully removed exercise.' });
    }

    async handleUpdateExerciseRoute(req, res) {
        const list = await this.exerciseService.updateExercise({
            id: req.params.id,
            name: req.body.name,
            categoryId: req.body.category_id,
            sets: req.body.sets,
            reps: req.body.reps,
            hold: req.body.hold,
            description: req.body.description,
            howTo: req.body.how_to,
            photo: req.files?.photo,
            video: req.files?.video,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.UPDATE_EXERCISE);

        return res.json(list);
    }
}
