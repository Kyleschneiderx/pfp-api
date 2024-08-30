export default class BadRequest extends Error {
    constructor(message) {
        super(JSON.stringify(message));
        this.statusCode = 400;
    }
}
