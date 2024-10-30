import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ selectionService, file, exerciseService }) => [
    body('name')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Name is required.')
        .isString()
        .withMessage('Name should be string.')
        .isLength({ max: 150 })
        .withMessage('Name should not exceed 150 characters.')
        .custom(async (value) => {
            if (await exerciseService.isExerciseNameExist(value)) {
                throw new Error('Exercise name already exists.');
            }

            return true;
        }),
    body('category_id')
        .exists({ values: 'falsy' })
        .withMessage('Exercise category is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await selectionService.isExerciseCategoryExistById(value))) {
                throw new Error('Exercise category does not exist.');
            }
        }),
    body('sets')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of sets is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Sets should be numeric.'),
    body('reps')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Reps should be numeric.'),
    body('hold')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of hold is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Hold should be numeric.'),
    body('description').trim().optional().isString().withMessage('Description should be string.'),
    body('how_to').trim().optional().isString().withMessage('How to should be string.'),
    ...commonValidation.photoValidation({ field: 'photo', file: file, isRequired: true }),
    commonValidation.videoValidation({ field: 'video', file: file, isRequired: true }),
];
