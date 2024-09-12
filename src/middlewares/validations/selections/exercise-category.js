import { body, param } from 'express-validator';

export default ({ selectionService, isUpdate = false, isDelete = false }) => {
    const rules = [];

    if (isUpdate || isDelete) {
        rules.push(
            param('id')
                .exists({ values: 'falsy' })
                .withMessage('ID is required.')
                .customSanitizer((value) => Number(value))
                .custom(async (value) => {
                    if (!(await selectionService.isExerciseCategoryExistById(value))) {
                        throw new Error('User does not exist.');
                    }
                    return true;
                }),
        );
    }

    if (!isDelete) {
        rules.push(
            body('name')
                .trim()
                .exists({ values: 'falsy' })
                .withMessage('Name is required.')
                .isString()
                .isLength({ max: 100 })
                .custom(async (value, { req }) => {
                    if (await selectionService.isExerciseCategoryExistByValue(value, isUpdate ? req.params.id : undefined)) {
                        throw new Error('Exercise category already exist.');
                    }
                    return true;
                }),
        );
    }

    return rules;
};
