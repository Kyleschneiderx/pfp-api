import * as commonValidation from '../common/index.js';

export default ({ userService }) => [
    commonValidation.userAccessUserIdValidation({ userService }),
    commonValidation.emailValidation().exists({ value: 'falsy' }).withMessage('Email is required.'),
];
