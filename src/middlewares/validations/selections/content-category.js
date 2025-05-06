import { body, param } from 'express-validator';

export default ({ selectionService, miscellaneousService, isUpdate = false, isDelete = false }) => {
    let rules = [];

    if (isUpdate || isDelete) {
        rules.push(
            param('id')
                .exists({ values: 'falsy' })
                .withMessage('ID is required.')
                .customSanitizer((value) => Number(value))
                .custom(async (value) => {
                    if (!(await selectionService.isContentCategoryExistById(value))) {
                        throw new Error('Category does not exist.');
                    }
                    return true;
                }),
        );
    }

    if (!isDelete) {
        rules = [
            ...rules,
            body('description')
                .trim()
                .exists({ values: 'falsy' })
                .withMessage('Description is required.')
                .isString()
                .withMessage('Description should be string.')
                .isLength({ max: 100 })
                .withMessage('Description should not exceed 100 characters.')
                .custom(async (value, { req }) => {
                    if (await selectionService.isContentCategoryExistByDescription(value, req.params.id)) {
                        throw new Error('Category already exist.');
                    }
                    return true;
                }),
            body('question_id')
                .optional()
                .isArray()
                .withMessage('Question id should be array.')
                .custom(async (value) => {
                    if (value.length === 0) {
                        return true;
                    }

                    value = [...new Set(value)];

                    const isQuestionExistMap = await Promise.all(value.map((id) => miscellaneousService.isSurveyQuestionExistById(id)));

                    if (isQuestionExistMap.includes(false)) {
                        throw new Error('Question does not exist.');
                    }

                    return true;
                }),
        ];
    }

    return rules;
};
