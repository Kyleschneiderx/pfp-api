import Forbidden from '../exceptions/forbidden.js';
import { USER_ACCOUNT_TYPE_ID } from '../constants/index.js';

export default ({ userService }) =>
    async (req, res, next) => {
        if (req.auth.account_type_id === USER_ACCOUNT_TYPE_ID) {
            if (!(await userService.isUserPremium(req.auth.user_id))) {
                throw new Forbidden('You cannot access this content.');
            }
        }

        return next();
    };
