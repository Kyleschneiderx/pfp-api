import { body } from 'express-validator';

export default () =>
    body('email')
        .trim()
        .isString()
        .withMessage('Email should be string.')
        .isEmail()
        .withMessage('Invalid email.')
        .isLength({ max: 150 })
        .withMessage('Email should not exceed 150 characters.');
