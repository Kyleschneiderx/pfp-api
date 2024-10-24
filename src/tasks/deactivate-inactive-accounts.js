import { NOTIFICATIONS } from '../constants/index.js';

export default ({ logger, userService, notificationService }) => {
    const name = 'Deactivate Inactive Accounts';

    return {
        name: name,
        schedule: '0 */1 * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                const deactivatedUsers = await userService.deactivateInactiveAccounts();

                if (deactivatedUsers?.length > 0) {
                    notificationService.createNotification(
                        deactivatedUsers.map((user) => ({
                            userId: user.id,
                            descriptionId: NOTIFICATIONS.ACCOUNT_INACTIVE,
                        })),
                    );
                }
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
