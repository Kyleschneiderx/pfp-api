import { body } from 'express-validator';

export default () => body('email').trim().isString().isEmail().isLength({ max: 150 });
