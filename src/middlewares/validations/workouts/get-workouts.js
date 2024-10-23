import * as commonValidation from '../common/index.js';

export default () => [
    commonValidation.filterValidation({ field: 'id', isInt: true }),
    commonValidation.filterValidation({ field: 'name', isString: true }),
    commonValidation.filterValidation({ field: 'status_id', isInt: true }),
    ...commonValidation.paginationValidation(),
];
