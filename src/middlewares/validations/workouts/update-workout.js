import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ workoutService, exerciseService }) => [
    commonValidation.workoutIdValidation({ workoutService, field: 'id' }),
    body('name').trim().optional().notEmpty().withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('description').trim().optional().notEmpty().isString().isLength({ max: 200 }),
    commonValidation.exerciseIdValidation({ exerciseService, isBody: true, field: 'exercises.*.exercise_id' }),
    body('exercises.*.sets')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of sets is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('exercises.*.reps')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('exercises.*.hold')
        .trim()
        .exists()
        .withMessage('Number of hold is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
];
