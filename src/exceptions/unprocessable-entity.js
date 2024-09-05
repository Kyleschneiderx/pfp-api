export default class UnprocessableEntity extends Error {
    constructor(message) {
        super(JSON.stringify(message));
        this.statusCode = 422;
    }
}
