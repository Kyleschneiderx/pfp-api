import { body } from 'express-validator';

export default () => [body('email').trim().exists({ values: 'falsy' }).withMessage('Email is required.').isString().isEmail()];
