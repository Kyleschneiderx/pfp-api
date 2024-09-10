export default class Storage {
    constructor({ logger, driver }) {
        this.driver = driver;
        this.logger = logger;
    }

    store() {}

    delete() {}
}
