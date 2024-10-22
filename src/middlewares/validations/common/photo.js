import { check, body } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ field, file, isRequired = false }) => [
    body(field)
        .trim()
        .optional()
        .if(body('photo').exists({ values: 'falsy' }))
        .isURL()
        .withMessage('Photo must be URL'),
    body(field)
        .custom((value, { req }) => {
            if (req.files !== undefined) return true;

            if (isRequired && value === undefined) throw new Error(`${field} is required.`);

            return true;
        })
        .customSanitizer(async (value, { req }) => {
            if (value === undefined || value === null || value === '') return;

            try {
                const response = await fetch(value);
                const contentType = response.headers.get('content-type');
                const contentLength = response.headers.get('content-length');
                const arrayBuffer = await response.arrayBuffer();

                req.files = {};

                req.files[field] = {
                    name: `${value.split('/').pop()}.${file.getExtensionByMimeType(contentType)?.toLowerCase()}`,
                    data: Buffer.from(arrayBuffer),
                    mimetype: contentType,
                    size: Number(contentLength),
                };
            } catch (error) {
                throw new Error('Failed to process photo URL.');
            }
        }),
    check(field)
        .if(body('photo').exists({ values: 'falsy' }))
        .custom((value, { req }) => {
            if ((req.files === undefined || req.files === null) && isRequired === false) return true;

            const photo = req.files?.[field];

            if (isRequired && photo === undefined) throw new Error(`${field} is required.`);

            if (photo !== undefined) {
                if (photo.mimetype.includes('image') === false) throw new Error('You can only upload image file.');

                if (!constants.ALLOWED_PHOTO_TYPE.includes(file.extractExtension(photo.name)?.toLowerCase()))
                    throw new Error('Invalid image file type.');

                if (!file.isValidFileSize(photo.size, constants.MAX_PHOTO_SIZE_IN_MB)) {
                    throw Error(`Maximum image file size can be upload is ${constants.MAX_PHOTO_SIZE_IN_MB} MB.`);
                }
            }

            return true;
        }),
];
