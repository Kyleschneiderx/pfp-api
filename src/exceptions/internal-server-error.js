export default class InternalServerError extends Error {
    constructor(message, error = null) {
        super(JSON.stringify(message), { cause: error });
        this.statusCode = 500;
        this.isCustom = true;
    }
}
