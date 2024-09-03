import * as commonValidation from '../common/index.js';

export default ({ userService, file, selectionService }) => [
    ...commonValidation.createUserValidation({ userService }),
    ...commonValidation.userTypeIdValidation({ selectionService: selectionService, isOptional: false }),
    ...commonValidation.photoValidation({ field: 'photo', file: file }),
];
