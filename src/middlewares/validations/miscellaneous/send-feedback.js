import { body, oneOf } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default () => [
    commonValidation.emailValidation().exists({ values: 'falsy' }).withMessage('Email is required'),
    oneOf([
        body('rating').exists({ value: 'falsy' }).withMessage('Rating is required.'),
        body('rating_reason').exists({ value: 'falsy' }).withMessage('Rating reason is required.'),
        body('useful_feature').exists({ value: 'falsy' }).withMessage('Useful feature is required.'),
        body('enhancement').exists({ value: 'falsy' }).withMessage('Enhancement is required.'),
    ]),
    body('rating')
        .if(body('rating_reason').exists({ value: 'falsy' }))
        .if(oneOf([body('rating').not().exists({ value: 'falsy' }), body('rating_reasons').exists({ value: 'falsy' })]))
        // .custom((value) => console.log(123))
        .exists({ value: 'falsy' })
        .withMessage('Rating is required.')
        .isNumeric()
        .withMessage('Rating should be number.')
        .isInt({ min: 1, max: 10 })
        .withMessage('Rating should be between 1 and 10.'),
    body('rating_reason')
        .if(body('rating_reason').exists({ value: 'falsy' }))
        .isString()
        .withMessage('Rating reason should be string.')
        .trim(),
    body('useful_feature')
        .if(body('useful_feature').exists({ value: 'falsy' }))
        .isString()
        .withMessage('Useful feature should be string')
        .trim(),
    body('enhancement')
        .if(body('enhancement').exists({ value: 'falsy' }))
        .isString()
        .withMessage('Enhancement should be string.')
        .trim(),
];
