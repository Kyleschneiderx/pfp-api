import { param, body } from 'express-validator';
import { ADMIN_ACCOUNT_TYPE_ID } from '../../../constants/index.js';

export default ({
    educationService,
    field = 'id',
    isBody = false,
    isRequired = true,
    isPublishedOnly = false,
    isFavorite = false,
    isUnfavorite = false,
}) => {
    let rule = param(field);

    if (isBody) rule = body(field);

    if (isRequired) {
        rule.exists({ values: 'falsy' });
    } else {
        rule.optional().notEmpty();
    }

    rule.withMessage('Education id is required.')
        .customSanitizer((value) => Number(value))
        .custom(async (value, { req }) => {
            const isEducationExist =
                req.auth.account_type_id !== ADMIN_ACCOUNT_TYPE_ID || isPublishedOnly
                    ? await educationService.isPublishedEducationExistById(value)
                    : await educationService.isEducationExistById(value);

            if (!isEducationExist) {
                throw new Error('Education does not exist.');
            }

            return true;
        });

    if (isFavorite || isUnfavorite) {
        rule.custom(async (value, { req }) => {
            const isFavoriteExist = await educationService.isFavoriteEducationExistById(value, req.auth.user_id);

            if (isFavoriteExist && isFavorite) {
                throw new Error('Education is already in favorite list.');
            }

            if (!isFavoriteExist && isUnfavorite) {
                throw new Error('Education is not yet in favorite list.');
            }

            return true;
        });
    }

    return rule;
};
