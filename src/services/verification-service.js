import crypto from 'crypto';
import * as dateFns from 'date-fns';
import { Sequelize } from 'sequelize';
import * as exceptions from '../exceptions/index.js';
import { OTP_EXPIRATION_IN_SECONDS } from '../constants/index.js';

export default class VerificationService {
    constructor({ logger, database, smtp, jwt, file, emailService }) {
        this.database = database;
        this.logger = logger;
        this.smtp = smtp;
        this.jwt = jwt;
        this.file = file;
        this.emailService = emailService;
    }

    /**
     * Generate verification code
     * @returns {number}
     */
    generateVerificationCode() {
        return crypto.randomInt(100000, 999999);
    }

    /**
     * Send OTP email to user
     * @param {string} email User email address
     * @returns {Promise<object>} Nodemailer send object
     * @throws {InternalServerError} If failed to get pending otp
     * @throws {UnprocessableEntity} If user already have pending otp
     * @throws {InternalServerError} If failed to generate OTP code
     * @throws {InternalServerError} If failed to send OTP email
     */
    async sendOtp(email, name = undefined) {
        const code = this.generateVerificationCode();

        let verificationCode;
        try {
            verificationCode = await this.database.models.VerificationCodes.create({
                email: email,
                code: code,
            });
        } catch (error) {
            this.logger.error('Failed to generate OTP code.', error);

            throw new exceptions.InternalServerError('Failed to generate OTP code.', error);
        }

        await this.emailService.sendOtpEmail({
            receiver: {
                ...(name && { name: name }),
                address: email,
            },
            code: code,
        });

        return verificationCode;
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
     * Check if OTP exist by email
     * @param {string} email User email address
     * @param {string} otp OTP code
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check OTP code
     */
    async isOtpExistByEmail(email, otp) {
        try {
            const otpCode = await this.database.models.VerificationCodes.count({
                where: { email: email, code: otp, verified_at: { [Sequelize.Op.ne]: null } },
            });

            return Boolean(otpCode);
        } catch (error) {
            this.logger.error('Failed to check OTP code', error);

            throw new exceptions.InternalServerError('Failed to check OTP code', error);
        }
    }

    /**
     * Link or verify account with email
     * @param {number} userId User account user id
     * @param {string} email User account email address
     * @returns {Promise<void>}
     * @throws {InternalServerError} If failed to verify account
     */
    async verifyAccount(userId, email) {
        try {
            return this.database.models.Users.update({ email: email, verified_at: new Date() }, { where: { id: userId } });
        } catch (error) {
            this.logger.error('Failed to verify account', error);

            throw new exceptions.InternalServerError('Failed to verify account', error);
        }
    }
}
