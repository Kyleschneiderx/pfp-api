import jwt from 'jsonwebtoken';

export default class Jwt {
    /**
     * Generate JWT token using RS512 algorithm by default.
     *
     * @param {string} secret - Secret key to use in encryption.
     * @param {object} payload - Payload to embed in the token.
     * @param {object=} options
     * @param {string} options.issuer - Token issuer
     * @param {string} options.sub - Token subject
     * @param {string} options.aud - Token audience
     * @param {number} options.expiration - Minutes till the token expire
     * @param {string} options.algorithm - Algorithm to use in encryption
     * @returns {{token: string, expires: number}}
     */
    static generate(secret, payload, options = {}) {
        const expInMinute = options?.expiration ?? 60;
        let expiresIn = Math.floor(Date.now() / 1000) + 60 * expInMinute;
        const signOptions = {
            issuer: options?.issuer ?? '',
            subject: options?.sub ?? '',
            audience: options?.aud ?? '',
            expiresIn: expiresIn - Math.floor(Date.now() / 1000),
            algorithm: options?.algorithm ?? 'RS512',
        };

        if (options?.expiration === 0) {
            expiresIn = null;
            delete signOptions.expiresIn;
        }

        const token = jwt.sign(payload, secret, signOptions);

        return { token: token, expires: expiresIn };
    }

    /**
     * Verify JWT token
     *
     * @param {string} token
     * @param {string} secret
     * @returns {jwt.JwtPayload}
     */
    static verify(token, secret) {
        return jwt.verify(token, secret);
    }
}
