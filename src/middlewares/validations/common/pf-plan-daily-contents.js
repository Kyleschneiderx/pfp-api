import { body } from 'express-validator';
import exerciseIdValidation from './exercise-id.js';
import educationIdValidation from './education-id.js';

export default ({ exerciseService, educationService, pfPlanService }) => [
    body('dailies.*.contents')
        .exists({ value: 'falsy' })
        .withMessage('Daily contents is required.')
        .isArray({ min: 1 })
        .withMessage('Daily contents should not be empty.'),
    body('dailies.*.contents.*').custom((value) => {
        if (value.exercise_id === undefined && value.education_id === undefined) throw new Error('Either exercise or education is required');

        if (value.exercise_id !== undefined) {
            if (value.sets === undefined) throw new Error('Number of sets is required.');
            if (value.reps === undefined) throw new Error('Number of reps is required.');
            if (value.hold === undefined) throw new Error('Number of hold is required.');
        }

        return true;
    }),
    body('dailies.*.contents.*.content_id')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('PF plan daily id is required.')
        .custom(async (value, { req, pathValues }) => {
            if (!(await pfPlanService.isPfPlanDailyContentExistById(value, req.body.dailies[pathValues[0]].daily_id))) {
                throw new Error('PF plan daily content does not exists.');
            }

            return true;
        }),
    exerciseIdValidation({
        exerciseService,
        isBody: true,
        isRequired: false,
        field: 'dailies.*.contents.*.exercise_id',
    }),
    body('dailies.*.contents.*.sets')
        .if((value, { req, pathValues }) => req.body.dailies[pathValues[0]].contents[pathValues[1]].exercise_id !== undefined)
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of sets is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Sets should be numeric')
        .isInt({ gt: 0 })
        .withMessage('Sets should be greater than 0.'),
    body('dailies.*.contents.*.reps')
        .if((value, { req, pathValues }) => req.body.dailies[pathValues[0]].contents[pathValues[1]].exercise_id !== undefined)
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of reps is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Reps should be numeric')
        .isInt({ gt: 0 })
        .withMessage('Reps should be greater than 0.'),
    body('dailies.*.contents.*.hold')
        .if((value, { req, pathValues }) => req.body.dailies[pathValues[0]].contents[pathValues[1]].exercise_id !== undefined)
        .optional()
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Hold should be numeric'),
    body('dailies.*.contents.*.rest')
        .if((value, { req, pathValues }) => req.body.dailies[pathValues[0]].contents[pathValues[1]].exercise_id !== undefined)
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Number of rest is required.')
        .customSanitizer((value) => Number(value))
        .isNumeric()
        .withMessage('Rest should be numeric')
        .isInt({ gt: 0 })
        .withMessage('Rest should be greater than 0.'),
    educationIdValidation({
        educationService,
        isBody: true,
        isRequired: false,
        field: 'dailies.*.contents.*.education_id',
    }),
];
