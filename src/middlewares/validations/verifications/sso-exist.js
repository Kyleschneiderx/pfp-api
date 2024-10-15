import { param } from 'express-validator';

export default ({ userService, authService }) =>
    param('token')
        .trim()
        .exists({ values: 'falsy' })
        .withMessage('SSO token is required.')
        .isString()
        .custom(async (value) => {
            let decodedToken;
            try {
                decodedToken = await authService.verifySocialMediaIdToken(value);
            } catch (error) {
                throw new Error('Invalid SSO token.');
            }

            let googleId;

            let appleId;

            if (decodedToken?.firebase?.identities?.['google.com'] !== undefined) {
                [googleId] = decodedToken.firebase.identities['google.com'];
            }

            if (decodedToken?.firebase?.identities?.['apple.com'] !== undefined) {
                [appleId] = decodedToken.firebase.identities['apple.com'];
            }

            if (googleId === undefined && appleId === undefined) {
                throw new Error('Invalid SSO token.');
            }

            if (googleId !== undefined) {
                if (!(await userService.isGoogleIdExist(googleId))) {
                    throw new Error('Google id does not exist');
                }
            }

            if (appleId !== undefined) {
                if (!(await userService.isAppleIdExist(appleId))) {
                    throw new Error('Apple id does not exist');
                }
            }

            return true;
        });
