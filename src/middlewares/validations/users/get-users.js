import * as commonValidation from '../common/index.js';

export default () => [
    commonValidation.filterValidation({ field: 'id', isInt: true }),
    commonValidation.filterValidation({ field: 'email', isString: true }),
    commonValidation.filterValidation({ field: 'name', isString: true }),
    commonValidation.filterValidation({ field: 'status_id' }).customSanitizer((value) => {
        if (!Array.isArray(value)) {
            value = [value];
        }

        return value.map((val) => Number(val));
    }),
    ...commonValidation.paginationValidation(),
];
