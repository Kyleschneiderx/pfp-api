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
}
