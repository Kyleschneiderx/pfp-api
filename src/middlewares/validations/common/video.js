import { check } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ field, file }) => [
    check(field).custom((value, { req }) => {
        if (req.files === undefined) return false;

        const video = req.files?.[field];

        if (video !== undefined) {
            if (video.mimetype.includes('image') === false) throw new Error('You can only upload video file.');

            if (!constants.ALLOWED_VIDEO_TYPE.includes(file.extractExtension(video.name))) throw new Error('Invalid video file type.');

            if (!file.isValidFileSize(video.size, constants.MAX_VIDEO_SIZE_IN_MB)) {
                throw Error(`Maximum video file size can be upload is ${constants.MAX_VIDEO_SIZE_IN_MB} MB.`);
            }
        }

        return true;
    }),
];
