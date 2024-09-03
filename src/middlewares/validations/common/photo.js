import { check } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ field, file }) => [
    check(field).custom((value, { req }) => {
        if (req.files === undefined || req.files === null) return true;

        const photo = req.files?.[field];

        if (photo !== undefined) {
            if (photo.mimetype.includes('image') === false) throw new Error('You can only upload image file.');

            if (!constants.ALLOWED_PHOTO_TYPE.includes(file.extractExtension(photo.name))) throw new Error('Invalid image file type.');

            if (!file.isValidFileSize(photo.size, constants.MAX_PHOTO_SIZE_IN_MB)) {
                throw Error(`Maximum image file size can be upload is ${constants.MAX_PHOTO_SIZE_IN_MB} MB.`);
            }
        }

        return true;
    }),
];
