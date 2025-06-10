import * as commonValidation from '../common/index.js';

export default ({ file }) => [...commonValidation.createGuestValidation({ file: file })];
