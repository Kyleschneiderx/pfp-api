export default ({ logger, userService, notificationService }) => {
    const name = 'New Subscriber Users Reminder';

    return {
        name: name,
        schedule: '0 0 * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            const notificationDescriptionIds = [11, 12, 13, 14, 15, 16];
            try {
                const newUsers = await userService.getDailyReminderNewlySubscribedUsers();
                if (newUsers.length > 0) {
                    notificationService.sendPushNotification(
                        newUsers.map((user) => ({
                            user_id: user.user_id,
                            description_id: notificationDescriptionIds[Math.floor(Math.random() * notificationDescriptionIds.length)],
                        })),
                    );
                }
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
