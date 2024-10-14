import { param, body } from 'express-validator';

export default ({ exerciseService, field = 'id', isBody = false, isRequired = true }) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    if (isRequired) {
        rule.exists({ values: 'falsy' });
    } else {
        rule.optional().notEmpty();
    }

    rule.withMessage('Exercise id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value) => {
            if (!(await exerciseService.isExerciseExistById(value))) {
                throw new Error('Exercise does not exist.');
            }
        });

    return rule;
};
