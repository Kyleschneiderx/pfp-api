import * as exceptions from '../exceptions/index.js';

export default (validations) => async (req, res, next) => {
    if (validations === undefined || validations.length === 0) throw new exceptions.InternalServerError('No validations rules passed');

    const errors = (
        await Promise.all(
            validations.map(async (validation) => {
                const result = await validation.run(req);
                if (result.errors.length) {
                    return result.errors;
                }
                return [];
            }),
        )
    ).flat();
    if (errors.length) {
        throw new exceptions.BadRequest([errors[0]]);
    }

    next();
};
