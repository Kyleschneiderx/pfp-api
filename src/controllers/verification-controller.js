export default class VerificationController {
    constructor({ verificationService, userService }) {
        this.verificationService = verificationService;
        this.userService = userService;
    }

    async handleSendOtpRoute(req, res) {
        await this.verificationService.sendOtpEmail(req.body.email);

        return res.status(200).json({ msg: 'Successfully sent OTP to your email. Check your OTP to proceed with your action.' });
    }
}
