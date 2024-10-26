import * as commonValidation from '../common/index.js';

export default ({ userService, file, selectionService }) => [
    ...commonValidation.createUserValidation({ userService: userService, file: file }),
    commonValidation.userTypeIdValidation({ selectionService: selectionService, isOptional: false }),
];
