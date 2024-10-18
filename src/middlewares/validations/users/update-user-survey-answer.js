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
    body('answers.*.yes_no').trim().exists({ value: 'falsy' }).withMessage('Answer for yes or no is required.'),
    body('answers.*.if_yes_how_much_bother')
        .trim()
        .if(body('answers.*.yes_no').equals('yes'))
        .exists({ value: 'falsy' })
        .custom((value) => value)
        .withMessage('Answer for if yes, how much does it bother you? is required.'),
];
