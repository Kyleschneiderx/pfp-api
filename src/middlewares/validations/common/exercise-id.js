import { param } from 'express-validator';

export default ({ exerciseService }) =>
    param('id')
        .exists({ values: 'falsy' })
        .withMessage('Exercise id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await exerciseService.isExerciseExistById(value))) {
                throw new Error('Exercise does not exist.');
            }
        });
