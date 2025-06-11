import { body } from 'express-validator';
import * as commonValidation from '../common/index.js';

export default ({ file }) => [
    body('device_id').trim().exists({ values: 'falsy' }).withMessage('Device id is required.').isString().isLength({ max: 150 }),
    body('name').trim().exists({ values: 'falsy' }).withMessage('Name is required.').isString().isLength({ max: 150 }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
];
