import { body } from 'express-validator';

export default ({ password, field = 'password', isSignup = false, isReset = false } = {}) => {
    const rule = body(field).trim();

    if (isSignup) {
        rule.if(body('google_token').not().exists({ values: 'falsy' })).if(body('apple_token').not().exists({ values: 'falsy' }));
    }

    rule.exists({ values: 'falsy' })
        .withMessage('Password is required.')
        .isString()
        .withMessage('Password should be string.')
        .isStrongPassword({
            minLength: 8,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1,
            minLowercase: 1,
        })
        .withMessage(`Password should be at least 8 characters and contains at least 1 number, special character, lower case and upper case.`);

    if (isReset) {
        rule.custom((value, { req }) => {
            if (password.verify(value, req.user.password)) {
                throw new Error('New password cannot be same as old password.');
            }
            return true;
        });
    }

    return [rule];
};
