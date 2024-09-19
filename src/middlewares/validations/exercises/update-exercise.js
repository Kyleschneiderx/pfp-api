import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ selectionService, file, exerciseService }) => [
    commonValidation.exerciseIdValidation({ exerciseService }),
    body('name').trim().optional().notEmpty().withMessage('Name is required.').isString().isLength({ max: 150 }),
    body('category_id')
        .optional()
        .notEmpty()
        .withMessage('Exercise category is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await selectionService.isExerciseCategoryExistById(value))) {
                throw new Error('Exercise category does not exist.');
            }
        }),
    body('sets')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Number of sets is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('reps')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('hold')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Number of hold is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('description').trim().optional().isString().isLength({ max: 200 }),
    body('how_to').trim().optional().isString(),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
    ...commonValidation.videoValidation({ field: 'video', file: file }),
];
