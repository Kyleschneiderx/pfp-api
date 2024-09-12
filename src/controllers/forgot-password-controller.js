import {
    ADMIN_ACCOUNT_TYPE_ID,
    WEB_RESET_PASSWORD_URL,
    APP_RESET_PASSWORD_URL,
    USED_RESET_PASSWORD_REQUEST_STATUS_ID,
    DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
} from '../constants/index.js';

export default class ForgotPasswordController {
    constructor({ emailService, userService, authService, verificationService }) {
        this.emailService = emailService;
        this.userService = userService;
        this.authService = authService;
        this.verificationService = verificationService;
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

        return res.json({ msg: 'Successfully sent reset password link to your email.' });
    }

    async handleForgotPasswordAppRoute(req, res) {
        const verificationCode = await this.verificationService.sendOtp(req.body.email);

        await this.authService.createResetPasswordRequest({
            userId: req.user.id,
            reference: verificationCode.code,
            statusId: DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID,
        });

        return res.json({ msg: 'Successfully sent OTP to your email for reset password. Check your OTP to proceed with your action.' });
    }

    async handleResetPasswordRoute(req, res) {
        await this.userService.resetUserPassword(req.user.id, req.body.password);

        await this.authService.updateResetPasswordRequestStatus(req.resetRequest.id, USED_RESET_PASSWORD_REQUEST_STATUS_ID);

        return res.json({ msg: 'Password successfully reset.' });
    }
}
