import { check } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ field, file, isRequired = false }) => [
    check(field).custom((value, { req }) => {
        if ((req.files === undefined || req.files === null) && isRequired === false) return true;

        const photo = req.files?.[field];

        if (isRequired && photo === undefined) throw new Error(`${field} is required.`);

        if (photo !== undefined) {
            if (photo.mimetype.includes('image') === false) throw new Error('You can only upload image file.');

            if (!constants.ALLOWED_PHOTO_TYPE.includes(file.extractExtension(photo.name)?.toLowerCase())) throw new Error('Invalid image file type.');

            if (!file.isValidFileSize(photo.size, constants.MAX_PHOTO_SIZE_IN_MB)) {
                throw Error(`Maximum image file size can be upload is ${constants.MAX_PHOTO_SIZE_IN_MB} MB.`);
            }
        }

        return true;
    }),
];
