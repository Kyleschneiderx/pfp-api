import { ADMIN_ACCOUNT_TYPE_ID, WEB_RESET_PASSWORD_URL, APP_RESET_PASSWORD_URL } from '../constants/index.js';

export default class ForgotPasswordController {
    constructor({ emailService, userService, authService, verificationService }) {
        this.emailService = emailService;
        this.userService = userService;
        this.authService = authService;
        this.verificationService = verificationService;
    }

    async handleForgotPasswordRoute(req, res) {
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
        await this.verificationService.sendOtp(req.body.email);

        return res.json({ msg: 'Successfully sent OTP to your email for reset password. Check your OTP to proceed with your action.' });
    }

    async handleResetPasswordRoute(req, res) {
        await this.userService.resetUserPassword(req.user.id, req.body.password);

        return res.json({ msg: 'Password successfully reset.' });
    }
}
