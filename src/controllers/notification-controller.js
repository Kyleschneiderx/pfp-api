import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS } from '../constants/index.js';

export default class NotificationController {
    constructor({ notificationService }) {
        this.notificationService = notificationService;
    }

    async handleGetNotificationsRoute(req, res) {
        return res.json(
            await this.notificationService.getNotifications({
                userId: req.auth.user_id,
                sort: req.query.sort,
                page: req.query.page ?? REPORT_DEFAULT_PAGE,
                pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
            }),
        );
    }

    async handleRemoveNotificationRoute(req, res) {
        await this.notificationService.removeUserNotifications(req.auth.user_id);

        return res.json({ msg: 'Notifications successfully removed' });
    }
}
