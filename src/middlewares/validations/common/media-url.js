import { body } from 'express-validator';
import { ALLOWED_PHOTO_TYPE, ALLOWED_VIDEO_TYPE } from '../../../constants/index.js';

export default ({ file }) =>
    body('media_url')
        .trim()
        .optional()
        .isString()
        .if(body('media_url').notEmpty())
        .isURL()
        .custom(async (value) => {
            const response = await fetch(value);

            const contentType = response.headers.get('content-type');

            if (!(contentType.includes('image') === true || contentType.includes('video') === true)) {
                throw new Error('You can only link image or video file.');
            }

            if (![...ALLOWED_PHOTO_TYPE, ...ALLOWED_VIDEO_TYPE].includes(file.getExtensionByMimeType(contentType)?.toLowerCase())) {
                throw new Error('Invalid image or video file type.');
            }

            return true;
        });
