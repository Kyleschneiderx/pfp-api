import crypto from 'crypto';
import * as dateFns from 'date-fns';
import { Sequelize } from 'sequelize';
import * as exceptions from '../exceptions/index.js';
import { OTP_RESEND_IN_SECONDS, OTP_EXPIRATION_IN_SECONDS, EMAIL_CONFIRMATION_URL } from '../constants/index.js';

export default class VerificationService {
    constructor({ logger, database, smtp, jwt, file }) {
        this.database = database;
        this.logger = logger;
        this.smtp = smtp;
        this.jwt = jwt;
        this.file = file;
    }

    /**
     * Generate verification code
     * @returns {number}
     */
    generateVerificationCode() {
        return crypto.randomInt(100000, 999999);
    }

    /**
     * Send verification email to user
     * @param {string} email User email address
     * @returns {Promise<object>} Nodemailer send object
     * @throws {InternalServerError} If failed to get pending otp
     * @throws {UnprocessableEntity} If user already have pending otp
     * @throws {InternalServerError} If failed to generate verification code
     * @throws {InternalServerError} If failed to send verification email
     */
    async sendOtpEmail(email, name = undefined) {
        const code = this.generateVerificationCode();

        let pendingOtp;
        let timeToConsiderResend;
        try {
            timeToConsiderResend = dateFns.sub(new Date(), { seconds: OTP_RESEND_IN_SECONDS });
            pendingOtp = await this.database.models.VerificationCodes.findOne({
                where: { email: email, updated_at: { [Sequelize.Op.gt]: timeToConsiderResend } },
                order: [['id', 'DESC']],
            });
        } catch (error) {
            this.logger.error('Failed to get pending OTP', error);

            throw new exceptions.InternalServerError('Failed to get pending OTP', error);
        }

        if (pendingOtp) {
            const remainingWaitingTime = dateFns.formatDistance(timeToConsiderResend, pendingOtp.updated_at, { includeSeconds: true });
            throw new exceptions.UnprocessableEntity(`Please try again after ${remainingWaitingTime}.`);
        }

        try {
            await this.database.models.VerificationCodes.create({
                email: email,
                code: code,
            });
        } catch (error) {
            this.logger.error('Failed to generate OTP code.', error);

            throw new exceptions.InternalServerError('Failed to generate OTP code.', error);
        }

        let template = this.file.readFile(`${__dirname}/templates/verification-code.html`, {
            encoding: 'utf8',
        });
        if (template) {
            template = template.replace(/{code}/g, code);
        }

        try {
            await this.smtp.send({
                from: `${process.env.SMTP_SENDER_NAME} <${process.env.SMTP_SENDER_EMAIL}>`,
                to: {
                    ...(name && { name: name }),
                    address: email,
                },
                subject: `[${process.env.APP_NAME}] One-Time PIN`,
                html: template,
            });
        } catch (error) {
            this.logger.error('Failed to send OTP email.', error);

            throw new exceptions.InternalServerError('Failed to send OTP email.', error);
        }
    }

    /**
     * Verify OTP code
     * @param {string} email User email address
     * @param {string} code  OTP code sent to email address
     * @returns {Promise<void>}
     * @throws {InternalServerError} If failed to get OTP code
     * @throws {UnprocessableEntity} If invalid OTP code
     * @throws {UnprocessableEntity} If expired OTP code
     * @throws {InternalServerError} If failed to verify OTP code
     */
    async verifyOtp(email, code) {
        const currentTime = new Date();
        let otpCode;
        try {
            otpCode = await this.database.models.VerificationCodes.findOne({
                where: { email: email, code: code, verified_at: null },
            });
        } catch (error) {
            this.logger.error('Failed to get OTP code', error);

            throw new exceptions.InternalServerError('Failed to get OTP code', error);
        }

        if (!otpCode) {
            throw new exceptions.UnprocessableEntity('Invalid OTP code.');
        }

        const isCodeExpired = !dateFns.isWithinInterval(currentTime, {
            start: otpCode.updated_at,
            end: dateFns.add(otpCode.updated_at, { seconds: OTP_EXPIRATION_IN_SECONDS }),
        });

        if (isCodeExpired) {
            throw new exceptions.UnprocessableEntity('Expired OTP code.');
        }

        try {
            otpCode.verified_at = currentTime;
            await otpCode.save();
        } catch (error) {
            this.logger.error('Failed to verify OTP code', error);

            throw new exceptions.InternalServerError('Failed to verify OTP code', error);
        }
    }

    /**
     * Send confirmation email to user
     * @param {string} email User email address
     * @returns {Promise<void>}
     * @throws {InternalServerError} If failed to generate confirmation email link
     * @throws {InternalServerError} If failed to send confirmation email
     */
    async sendConfirmationEmail(email, name = undefined) {
        let token;
        try {
            token = this.jwt.generate(process.env.JWT_SECRET, { user: { email: email } }, { algorithm: process.env.JWT_ALGORITHM });
        } catch (error) {
            this.logger.error('Failed to generate confirmation email link.', error);

            throw new exceptions.InternalServerError('Failed to generate confirmation email link.', error);
        }

        try {
            this.smtp.send({
                from: `${process.env.SMTP_SENDER_NAME} <${process.env.SMTP_SENDER_EMAIL}>`,
                to: {
                    ...(name && { name: name }),
                    address: email,
                },
                subject: `[${process.env.APP_NAME}] Confirm your email`,
                html: `
                    <h1>Email Confirmation</h1>
                    <p>Click this link to confirm email: <strong><a href="${EMAIL_CONFIRMATION_URL}/${token.token}">confirm email</a></strong></p>
                `,
            });
        } catch (error) {
            this.logger.error('Failed to send confirmation email.', error);

            throw new exceptions.InternalServerError('Failed to send confirmation email.', error);
        }
    }

    /**
     * Verify confirmation email token
     * @param {string} token Confirmation email token
     * @returns {Promise<object>} Token payload
     * @throws {InternalServerError} If failed to verify confirmation email token
     */
    verifyConfirmationEmail(token) {
        let payload;
        try {
            payload = this.jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError(error.message, error);
        }

        return payload.user;
    }
}
