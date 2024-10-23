import * as commonValidation from '../common/index.js';

export default () => [
    commonValidation.filterValidation({ field: 'id', isInt: true }),
    commonValidation.filterValidation({ field: 'category_id' }).customSanitizer((value) => {
        if (value === '') return undefined;

        if (!Array.isArray(value)) {
            value = [value];
        }

        value = value.filter((val) => val !== '' && val !== undefined);

        if (value.length === 0) return undefined;

        return value;
    }),
    commonValidation.filterValidation({ field: 'sets_from', isInt: true }),
    commonValidation.filterValidation({ field: 'sets_to', isInt: true }),
    commonValidation.filterValidation({ field: 'reps_from', isInt: true }),
    commonValidation.filterValidation({ field: 'reps_to', isInt: true }),
    commonValidation.filterValidation({ field: 'name', isString: true }),
    ...commonValidation.paginationValidation(),
];
