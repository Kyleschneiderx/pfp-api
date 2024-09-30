import { body, check } from 'express-validator';
import * as commonValidation from '../common/index.js';
import {
    DRAFT_EDUCATION_STATUS_ID,
    PUBLISHED_EDUCATION_STATUS_ID,
    ALLOWED_PHOTO_TYPE,
    ALLOWED_VIDEO_TYPE,
    MAX_VIDEO_SIZE_IN_MB,
} from '../../../constants/index.js';

export default ({ educationService, selectionService, file }) => {
    const validateMediaType = (type, extension, allowed) => {
        if (!(type.includes('image') === true || type.includes('video') === true)) {
            throw new Error('You can only link image or video file.');
        }

        if (!allowed.includes(extension)) {
            throw new Error('Invalid image or video file type.');
        }

        return true;
    };

    return [
        commonValidation.educationIdValidation({ educationService, field: 'id' }),
        body('title').trim().optional().notEmpty().withMessage('Title is required.').isString().isLength({ max: 150 }),
        body('content').trim().optional().notEmpty().isString(),
        commonValidation.statusIdValidation({
            selectionService,
            allowedStatuses: [DRAFT_EDUCATION_STATUS_ID, PUBLISHED_EDUCATION_STATUS_ID],
            isRequired: false,
        }),
        ...commonValidation.photoValidation({ field: 'photo', file: file }),
        body('media_url')
            .trim()
            .optional()
            .isString()
            .if(body('media_url').notEmpty())
            .isURL()
            .custom(async (value) => {
                const response = await fetch(value);

                const contentType = response.headers.get('content-type');

                validateMediaType(contentType, file.getExtensionByMimeType(contentType)?.toLowerCase(), [
                    ...ALLOWED_PHOTO_TYPE,
                    ...ALLOWED_VIDEO_TYPE,
                ]);

                return true;
            }),
        check('media_upload').custom((value, { req }) => {
            if (req.files === undefined || req.files === null) return true;

            const media = req.files?.media_upload;

            if (media !== undefined) {
                validateMediaType(media.mimetype, file.extractExtension(media.name)?.toLowerCase(), [...ALLOWED_PHOTO_TYPE, ...ALLOWED_VIDEO_TYPE]);

                if (!file.isValidFileSize(media.size, MAX_VIDEO_SIZE_IN_MB)) {
                    throw Error(`Maximum media file size can be upload is ${MAX_VIDEO_SIZE_IN_MB} MB.`);
                }
            }

            return true;
        }),
    ];
};
