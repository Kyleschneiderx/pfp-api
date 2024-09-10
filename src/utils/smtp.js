import nodemailer from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export default class Smtp {
    /**
     *
     * @param {object} config SMTP settings
     * @param {string} config.host SMTP host
     * @param {string} config.port SMTP port. Default to 465.
     * @param {boolean} config.secure Use secured connection to the SMTP server. Default to false.
     * @param {string} config.user SMTP account username.
     * @param {string} config.password SMTP account password.
     */
    constructor(config, { logger = undefined }) {
        this.client = null;
        this.logger = logger;
        if (Object.keys(config).length > 0) {
            this.init(config);
        }
    }

    /**
     * Check connection to SMTP server.
     *
     * @returns {boolean}
     */
    async checkConnection() {
        try {
            return await this.client.verify();
        } catch (error) {
            this.logger.error('Failed to check SMTP connection.', error);

            throw new Error(`SMTP Response: ${error.message}`, { cause: error });
        }
    }

    /**
     *
     * @param {object} config SMTP settings
     * @param {string} config.host SMTP host
     * @param {string} config.port SMTP port. Default to 465.
     * @param {boolean} config.secure Use secured connection to the SMTP server. Default to false.
     * @param {object} config.tls Use secured connection to the SMTP server. Default to false.
     * @param {string} config.user SMTP account username.
     * @param {string} config.password SMTP account password.
     * @returns {SMTP}
     */
    init(config) {
        this.config = config;
        const transportOptions = {
            ...(config.standard && {
                pool: true,
                maxConnections: 20,
                host: this.config?.standard?.host ?? 'localhost',
                port: Number(this.config?.standard?.port ?? 465),
                secure: this.config?.standard?.secure ?? false, // use TLS
                tls: this.config?.standard?.tls ?? {
                    maxVersion: 'TLSv1.3',
                    minVersion: 'TLSv1.2',
                    ciphers: 'SSLv3',
                },
                auth: {
                    user: this.config?.standard?.user,
                    pass: this.config?.standard?.password,
                },
            }),
            ...(config.ses && {
                SES: {
                    ses: new aws.SES({ ...this.config.ses, defaultProvider }),
                    aws,
                },
            }),
        };
        try {
            this.client = nodemailer.createTransport(transportOptions);
            return this;
        } catch (error) {
            this.logger.error('Failed to initialize SMTP connection.', error);

            throw new Error(`SMTP Response: ${error.message}`, { cause: error });
        }
    }

    /**
     * Send email.
     *
     * @param {object} options Meessage options. Check {@link https://www.nodemailer.com/message} for other possible parameters when sending email. Included here are those commonly used parameters.
     * @param {string} options.from The email address of the sender. All email addresses can be plain or formatted.
     * @example
     * Using plain email address:
     * ```sample@email.com```
     *
     * Using name alongside email address:
     * ```John Doe <sample@email.com>```
     *
     * Using email address object:
     * ```js
     * {
     *   name: 'John Doe',
     *   address: 'sample@email.com'
     * }
     * ```
     * @param {string} options.to Comma separated list or an array of recipients email addresses that will appear on the To: field.
     * @example
     * Using plain email address:
     * ```sample@email.com```
     *
     * Using name alongside email address:
     * ```John Doe <sample@email.com>```
     *
     * Using email address object:
     * ```js
     * {
     *   name: 'John Doe',
     *   address: 'sample@email.com'
     * }
     * ```
     * @param {string} options.bcc Comma separated list or an array of recipients email addresses that will appear on the Bcc: field.
     * @param {string} options.cc Comma separated list or an array of recipients email addresses that will appear on the Cc: field.
     * @param {string} options.html The HTML version of the message as an Unicode string, Buffer, Stream or an attachment-like object ({path: ‘http://…'}).
     * @param {string} options.text The plaintext version of the message as an Unicode string, Buffer, Stream or an attachment-like object ({path: ‘/var/data/…'}).
     * @param {string} options.subject The subject of the email.
     * @param {object} options.attachment File/s to attach in the email. Check {@link https://www.nodemailer.com/message/attachments} parameters available for attachment.
     * @example
     * attachments: [
     *    {   // utf-8 string as an attachment
     *        filename: 'text1.txt',
     *        content: 'hello world!'
     *    },
     *    {   // binary buffer as an attachment
     *        filename: 'text2.txt',
     *        content: new Buffer('hello world!','utf-8')
     *    },
     *    {   // file on disk as an attachment
     *        filename: 'text3.txt',
     *        path: '/path/to/file.txt' // stream this file
     *    },
     *    {   // filename and content type is derived from path
     *        path: '/path/to/file.txt'
     *    },
     *    {   // stream as an attachment
     *        filename: 'text4.txt',
     *        content: fs.createReadStream('file.txt')
     *    },
     *    {   // define custom content type for the attachment
     *        filename: 'text.bin',
     *        content: 'hello world!',
     *        contentType: 'text/plain'
     *    },
     *    {   // use URL as an attachment
     *        filename: 'license.txt',
     *        path: 'https://raw.github.com/nodemailer/nodemailer/master/LICENSE'
     *    },
     *    {   // encoded string as an attachment
     *        filename: 'text1.txt',
     *        content: 'aGVsbG8gd29ybGQh',
     *        encoding: 'base64'
     *    },
     *    {   // data uri as an attachment
     *        path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
     *    },
     *    {
     *        // use pregenerated MIME node
     *        raw: 'Content-Type: text/plain\r\n' +
     *            'Content-Disposition: attachment;\r\n' +
     *            '\r\n' +
     *            'Hello world!'
     *    }
     * ]
     * @returns {object}
     */
    async send(options) {
        if (!(await this.checkConnection())) throw new Error('Failed to connect to SMTP server.');

        try {
            return await this.client.sendMail(options);
        } catch (error) {
            this.logger.error('Failed to send email.', error);

            throw new Error(`SMTP Response: ${error.message}`, { cause: error });
        }
    }
}
