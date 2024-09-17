export default class Forbidden extends Error {
    constructor(message) {
        super(JSON.stringify(message));
        this.statusCode = 403;
        this.isCustom = true;
    }
}
