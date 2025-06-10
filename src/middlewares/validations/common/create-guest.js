import { body } from 'express-validator';
import photoValidation from './photo.js';

export default ({ file }) => [
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 150 }),
    ...photoValidation({ field: 'photo', file: file }),
];
