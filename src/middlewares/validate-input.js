import * as exceptions from '../exceptions/index.js';

export default (validations) => async (req, res, next) => {
    if (validations === undefined || validations.length === 0) throw new exceptions.InternalServerError('No validations rules passed');

    // eslint-disable-next-line no-restricted-syntax
    for (const validation of validations) {
        // eslint-disable-next-line no-await-in-loop
        const result = await validation.run(req);
        console.log(result);
        if (result.errors.length) {
            if (result.errors[0].nestedErrors !== undefined && result.errors[0].nestedErrors.length !== 0) {
                throw new exceptions.BadRequest(result.errors[0].nestedErrors[0][0]);
            }
            throw new exceptions.BadRequest(result.errors[0]);
        }
    }

    return next();
};
