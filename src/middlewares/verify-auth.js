import Unauthorized from '../exceptions/unauthorized.js';

export default ({ jwt, exceptions = [], userService }) =>
    async (req, res, next) => {
        if (exceptions.includes(req.originalUrl)) return next();

        const { authorization } = req.headers;

        if (authorization === undefined) {
            throw new Unauthorized('No authorization provided.');
        }

        const [bearer, token] = authorization.split(' ');

        if (bearer === undefined || token === undefined) {
            throw new Unauthorized('Unable to verify token.');
        }

        try {
            const verifyToken = jwt.verify(token, process.env.JWT_SECRET);

            req.auth = verifyToken.user;

            if (!(await userService.getUser({ userId: req.auth.user_id }))) {
                throw new Error('User does not exist.');
            }

            return next();
        } catch (error) {
            throw new Unauthorized(error?.message);
        }
    };
