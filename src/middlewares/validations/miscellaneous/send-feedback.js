import { body, oneOf } from 'express-validator';

export default () => [
    oneOf([
        [
            body('rating')
                .exists({ values: 'falsy' })
                .withMessage('Rating is required.')
                .isNumeric()
                .withMessage('Rating should be number.')
                .isInt({ min: 1, max: 10 })
                .withMessage('Rating should be between 1 and 10.'),
            body('rating_reason')
                .trim()
                .exists({ values: 'falsy' })
                .withMessage('Rating reason is required.')
                .isString()
                .withMessage('Rating reason should be string.')
                .exists({ value: 'falsy' })
                .withMessage('Rating reason is required.'),
        ],
        body('useful_feature')
            .isString()
            .withMessage('Useful feature should be string')
            .exists({ value: 'falsy' })
            .withMessage('Useful feature is required.')
            .trim(),
        body('enhancement')
            .isString()
            .withMessage('Enhancement should be string.')
            .exists({ value: 'falsy' })
            .withMessage('Enhancement is required.')
            .trim(),
    ]),
];
