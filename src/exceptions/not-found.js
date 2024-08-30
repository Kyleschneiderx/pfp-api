export default class NotFound extends Error {
    constructor(message) {
        super(JSON.stringify(message));
        this.statusCode = 404;
    }
}
