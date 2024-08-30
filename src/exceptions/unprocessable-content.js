export default class UnprocessableContent extends Error {
    constructor(message) {
        super(JSON.stringify(message));
        this.statusCode = 422;
    }
}
