import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ userService, miscellaneousService }) => [
    commonValidation.userAccessUserIdValidation({ userService }),
    body('answers').exists({ value: 'falsy' }).withMessage('Answer is required.').isArray(),
    body('answers.*.question_id')
        .trim()
        .optional()
        .notEmpty()
        .withMessage('Survey question is required.')
        .custom(async (value) => {
            if (!(await miscellaneousService.isSurveyQuestionExistById(value))) {
                throw new Error('Survey question does not exists.');
            }

            return true;
        }),
    body('answers.*.answer').trim().exists({ value: 'falsy' }).withMessage('Survey answer is required.'),
];
