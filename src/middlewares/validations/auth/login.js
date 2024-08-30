import { body } from 'express-validator';

export default () => [
    body('email').trim().exists({ values: 'falsy' }).withMessage('Email is required.').isString(),
    body('password').trim().exists({ values: 'falsy' }).withMessage('Password is required.').isString(),
];
