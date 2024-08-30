import bcrypt from 'bcryptjs';

export default class Password {
    /**
     * Generate password hash
     * @param {string} password Password to hash
     * @returns {string}
     */
    static generate(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync());
    }

    /**
     * Verify a password against a hash
     * @param {string} password Inputted password
     * @param {string} hash Hashed password
     * @returns {boolean}
     */
    static verify(password, hash) {
        return bcrypt.compareSync(password, hash);
    }
}
