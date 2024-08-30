export default class Unauthorized extends Error {
    constructor(message) {
        super(JSON.stringify(message));
        this.statusCode = 401;
    }
}
