import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default () => [
    commonValidation.emailValidation().exists({ values: 'falsy' }).withMessage('Email is required'),
    body('message').trim().exists({ values: 'falsy' }).withMessage('Message is required.'),
];
