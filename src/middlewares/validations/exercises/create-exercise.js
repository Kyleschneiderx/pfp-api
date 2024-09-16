import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ selectionService, file }) => [
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 150 }),
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
        .isNumeric(),
    body('reps')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('hold')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of hold is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric(),
    body('description').trim().optional().isString().isLength({ max: 200 }),
    body('how_to').trim().optional().isString(),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
    ...commonValidation.videoValidation({ field: 'video', file: file }),
    ...commonValidation.audioValidation({ field: 'audio', file: file }),
];