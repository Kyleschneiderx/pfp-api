import { NOTIFICATIONS } from '../constants/index.js';

export default ({ logger, pfPlanService, notificationService }) => {
    const name = 'Daily PF Plan Reminder';

    return {
        name: name,
        schedule: '*/5 * * * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                const dailyPfPlanReminder = await pfPlanService.getUserDailyPfPlanReminder();
                if (dailyPfPlanReminder.length > 0) {
                    notificationService.createNotification(
                        dailyPfPlanReminder.map((dailyPfPlan) => ({
                            userId: dailyPfPlan.user_id,
                            descriptionId: NOTIFICATIONS.DAILY_PF_PLAN_REMINDER,
                            reference: JSON.stringify({
                                daily_id: String(dailyPfPlan.id),
                                pf_plan_id: String(dailyPfPlan.pf_plan_id),
                                name: dailyPfPlan.name,
                                day: String(dailyPfPlan.day),
                            }),
                        })),
                    );
                }
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
