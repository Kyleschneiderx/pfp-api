import { body } from 'express-validator';
import * as dateFnsTz from 'date-fns-tz';
import { DATE_FORMAT } from '../../../constants/index.js';

export default () => [
    body('is_enable')
        .trim()
        .exists({ value: 'falsy' })
        .withMessage('Notification state is required.')
        .isBoolean()
        .withMessage('Notification state should be boolean.'),
    body('time').trim().exists({ value: 'falsy' }).withMessage('Time is required.'),
    body('timezone')
        .trim()
        .exists({ value: 'falsy' })
        .withMessage('Timezone is required.')
        .custom((value) => {
            try {
                dateFnsTz.formatInTimeZone(new Date(), value, DATE_FORMAT);
            } catch (error) {
                throw new Error('Invalid timezone.');
            }

            return true;
        }),
];
