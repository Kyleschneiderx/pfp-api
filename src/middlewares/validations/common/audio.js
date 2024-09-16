import { check } from 'express-validator';
import * as constants from '../../../constants/index.js';

export default ({ field, file, isRequired = false }) => [
    check(field).custom((value, { req }) => {
        if ((req.files === undefined || req.files === null) && isRequired === false) return true;

        const audio = req.files?.[field];

        if (isRequired && audio === undefined) throw new Error(`${field} is required.`);

        if (audio !== undefined) {
            if (audio.mimetype.includes('audio') === false) throw new Error('You can only upload audio file.');

            if (!constants.ALLOWED_AUDIO_TYPE.includes(file.extractExtension(audio.name))) throw new Error('Invalid audio file type.');

            if (!file.isValidFileSize(audio.size, constants.MAX_AUDIO_SIZE_IN_MB)) {
                throw Error(`Maximum video file size can be upload is ${constants.MAX_AUDIO_SIZE_IN_MB} MB.`);
            }
        }

        return true;
    }),
];
