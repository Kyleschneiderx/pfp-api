import { body } from 'express-validator';

export default ({ field = 'password', isSignup = false }) => {
    const rule = body(field).trim();

    if (isSignup) {
        rule.if(body('google_token').not().exists({ values: 'falsy' })).if(body('apple_token').not().exists({ values: 'falsy' }));
    }

    rule.exists({ values: 'falsy' })
        .withMessage('Password is required.')
        .isString()
        .isStrongPassword({
            minLength: 8,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1,
            minLowercase: 1,
        })
        .withMessage(`Password should be at least 8 characters and contains at least 1 number, special character, lower case and upper case.`);

    return [rule];
};
