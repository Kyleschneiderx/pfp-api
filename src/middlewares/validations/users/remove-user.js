import * as commonValidation from '../common/index.js';

export default ({ userService }) => [...commonValidation.userIdValidation({ userService })];
