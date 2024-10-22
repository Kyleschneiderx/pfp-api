import {
    ADMIN_ACCOUNT_TYPE_ID,
    WEB_RESET_PASSWORD_URL,
    APP_RESET_PASSWORD_URL,
    USED_RESET_PASSWORD_REQUEST_STATUS_ID,
    DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
    SYSTEM_AUDITS,
} from '../constants/index.js';

export default class ForgotPasswordController {
    constructor({ emailService, userService, authService, verificationService, loggerService }) {
        this.emailService = emailService;
        this.userService = userService;
        this.authService = authService;
        this.verificationService = verificationService;
        this.loggerService = loggerService;
    }

    async handleForgotPasswordWebRoute(req, res) {
        const token = await this.authService.generateResetPasswordToken(req.user);

        await this.emailService.sendForgotPasswordEmail({
            receiver: {
                ...(req.user.user_profile.name && { name: req.user.user_profile.name }),
                address: req.user.email,
            },
            link: req.user.account_type_id === ADMIN_ACCOUNT_TYPE_ID ? `${WEB_RESET_PASSWORD_URL}/${token}` : `${APP_RESET_PASSWORD_URL}/${token}`,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.FORGOT_PASSWORD);

        return res.json({
            msg: 'Successfully sent reset password link to your email.',
            ...(process.env.APP_ENV !== 'production' && { token: token }),
        });
    }

    async handleForgotPasswordAppRoute(req, res) {
        const verificationCode = await this.verificationService.sendOtp(req.body.email);

        await this.authService.createResetPasswordRequest({
            userId: req.user.id,
            reference: verificationCode.code,
            statusId: DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.FORGOT_PASSWORD);

        return res.json({
            msg: 'Successfully sent OTP to your email for reset password. Check your OTP to proceed with your action.',
            ...(process.env.APP_ENV !== 'production' && { code: verificationCode.code }),
        });
    }

    async handleResetPasswordRoute(req, res) {
        await this.userService.resetUserPassword(req.user.id, req.body.password);

        await this.authService.updateResetPasswordRequestStatus(req.resetRequest.id, USED_RESET_PASSWORD_REQUEST_STATUS_ID);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.RESET_PASSWORD);

        return res.json({ msg: 'Password successfully reset.' });
    }
}
