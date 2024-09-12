import { body } from 'express-validator';

export default ({ authService }) =>
    body('token')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('Token is required.')
        .isString()
        .custom(async (value) => {
            try {
                await authService.verifyResetPasswordRequestReference(value);
                return true;
            } catch (error) {
                throw new Error(JSON.parse(error?.message));
            }
        });
