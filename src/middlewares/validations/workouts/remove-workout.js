import * as commonValidation from '../common/index.js';

export default ({ workoutService }) => [commonValidation.workoutIdValidation({ workoutService, field: 'id' })];
