export default ({ logger, userService, notificationService }) => {
    const name = 'New Non Subscriber Users Reminder';

    return {
        name: name,
        schedule: '0 0 * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            const notificationDescriptionIds = [7, 8, 9, 10];
            try {
                const newUsers = await userService.getDailyReminderNonSubscribedUsers();
                if (newUsers.length > 0) {
                    notificationService.sendPushNotification(
                        newUsers.map((user) => ({
                            user_id: user.id,
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
