import { check } from 'express-validator';
import { ALLOWED_PHOTO_TYPE, ALLOWED_VIDEO_TYPE, MAX_VIDEO_SIZE_IN_MB } from '../../../constants/index.js';

export default ({ file }) =>
    check('media_upload').custom((value, { req }) => {
        if (req.files === undefined || req.files === null) return true;

        const media = req.files?.media_upload;

        if (media !== undefined) {
            if (!(media.mimetype.includes('image') === true || media.mimetype.includes('video') === true)) {
                throw new Error('You can only link image or video file.');
            }

            if (![...ALLOWED_PHOTO_TYPE, ...ALLOWED_VIDEO_TYPE].includes(file.extractExtension(media.name)?.toLowerCase())) {
                throw new Error('Invalid image or video file type.');
            }

            if (!file.isValidFileSize(media.size, MAX_VIDEO_SIZE_IN_MB)) {
                throw Error(`Maximum media file size can be upload is ${MAX_VIDEO_SIZE_IN_MB} MB.`);
            }
        }

        return true;
    });
