import * as commonValidation from '../common/index.js';

export default ({ userService, verificationService }) => [
    commonValidation.emailValidation().exists({ value: 'falsy' }).withMessage('Email is required.'),
    commonValidation.oneTimePinValidation({ userService, verificationService }),
];
