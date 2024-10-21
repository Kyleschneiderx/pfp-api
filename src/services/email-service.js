import * as exceptions from '../exceptions/index.js';

export default class EmailService {
    constructor({ logger, smtp, file, helper }) {
        this.logger = logger;
        this.smtp = smtp;
        this.file = file;
        this.helper = helper;
    }

    /**
     * Send OTP email to user
     * @param {object} data Email data
     * @param {object} data.receiver Email receiver
     * @param {string} data.receiver.address Email receiver address
     * @param {string=} data.receiver.name Email receiver name
     * @param {string} data.code OTP code
     * @returns {Promise<object>} Nodemailer send object
     * @throws {InternalServerError} If failed to send OTP email
     */
    async sendOtpEmail(data) {
        let template = this.file.readFile(`${__dirname}/templates/verification-code.html`, {
            encoding: 'utf8',
        });
        if (template) {
            template = template.replace(/{code}/g, data.code ?? '');
        }

        try {
            return await this.smtp.send({
                from: `${process.env.SMTP_SENDER_NAME} <${process.env.SMTP_SENDER_EMAIL}>`,
                to: data.receiver,
                subject: `[${process.env.APP_NAME}] One-Time PIN`,
                html: template,
            });
        } catch (error) {
            this.logger.error('Failed to send OTP email.', error);

            throw new exceptions.InternalServerError('Failed to send OTP email.', error);
        }
    }

    /**
     * Send OTP email to user
     * @param {object} data Email data
     * @param {object} data.receiver Email receiver
     * @param {string} data.receiver.address Email receiver address
     * @param {string} data.receiver.name Email receiver name
     * @param {string} data.link Forgot password token
     * @returns {Promise<object>} Nodemailer send object
     * @throws {InternalServerError} If failed to send forgot password email
     */
    async sendForgotPasswordEmail(data) {
        let template = this.file.readFile(`${__dirname}/templates/forgot-password.html`, {
            encoding: 'utf8',
        });
        if (template) {
            template = template.replace(/{link}/g, data.link ?? '');
            template = template.replace(/{name}/g, data.receiver.name ?? '');
        }

        try {
            return await this.smtp.send({
                from: `${process.env.SMTP_SENDER_NAME} <${process.env.SMTP_SENDER_EMAIL}>`,
                to: data.receiver,
                subject: `[${process.env.APP_NAME}] Forgot Password`,
                html: template,
            });
        } catch (error) {
            this.logger.error('Failed to send forgot password email.', error);

            throw new exceptions.InternalServerError('Failed to send forgot password email.', error);
        }
    }

    /**
     * Send invite email to user
     *
     * @param {object} data Email data
     * @param {object} data.receiver Email receiver
     * @param {string} data.receiver.address Email receiver address
     * @param {string} data.receiver.name Email receiver name
     * @param {string} data.link Link to set up account
     * @returns {Promise<object>} Nodemailer send object
     * @throws {InternalServerError} If failed to send invite email
     */
    async sendInviteEmail(data) {
        let template = this.file.readFile(`${__dirname}/templates/send-invite.html`, {
            encoding: 'utf8',
        });
        if (template) {
            template = this.helper.replacer(template, {
                link: data.link ?? '',
                name: data.receiver.name ?? '',
            });
        }

        try {
            return await this.smtp.send({
                from: `${process.env.SMTP_SENDER_NAME} <${process.env.SMTP_SENDER_EMAIL}>`,
                to: data.receiver,
                subject: `Discover [${process.env.APP_NAME}] – Your New Favorite Mobile App!`,
                html: template,
            });
        } catch (error) {
            this.logger.error('Failed to send invite email.', error);

            throw new exceptions.InternalServerError('Failed to send invite email.', error);
        }
    }
}
