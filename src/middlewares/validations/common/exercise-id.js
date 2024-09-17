import { param, body } from 'express-validator';

export default ({ exerciseService, field = 'id', isBody = false }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    rule.exists({ values: 'falsy' })
        .withMessage('Exercise id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await exerciseService.isExerciseExistById(value))) {
                throw new Error('Exercise does not exist.');
            }
        });

    return rule;
};
