import * as commonValidation from '../common/index.js';

export default ({ educationService }) => [
    commonValidation.educationIdValidation({ educationService, field: 'id' }).custom(async (value) => {
        if (await educationService.isEducationAssociatedWithPfPlan(value)) {
            throw new Error('Education is associated with a PF plan');
        }

        return true;
    }),
];
