import Forbidden from '../exceptions/forbidden.js';
import { ADMIN_ACCOUNT_TYPE_ID } from '../constants/index.js';

export default (req, res, next) => {
    if (req.auth.account_type_id !== ADMIN_ACCOUNT_TYPE_ID) {
        throw new Forbidden('You are not authorized to perform this action.');
    }

    next();
};
