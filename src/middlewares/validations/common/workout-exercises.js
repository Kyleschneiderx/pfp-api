import { body } from 'express-validator';
import exerciseIdValidation from './exercise-id.js';

export default ({ exerciseService }) => [
    exerciseIdValidation({ exerciseService, isBody: true, field: 'exercises.*.exercise_id' }),
    body('exercises.*.sets')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of sets is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Sets should be numeric')
        .isInt({ gt: 0 })
        .withMessage('Sets should be greater than 0.'),
    body('exercises.*.reps')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Reps should be numeric')
        .isInt({ gt: 0 })
        .withMessage('Reps should be greater than 0.'),
    body('exercises.*.hold')
        .optional()
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Hold should be numeric'),
    body('exercises.*.rest')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of hold is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Rest should be numeric')
        .isInt({ gt: 0 })
        .withMessage('Rest should be greater than 0.'),
];
