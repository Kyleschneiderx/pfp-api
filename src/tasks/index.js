import deactivateInactiveAccounts from './deactivate-inactive-accounts.js';
import scanPfPlanRetentionPeriod from './scan-pf-plan-retention-period.js';
import dailyPfPlanReminder from './daily-pf-plan-reminder.js';
import scanExpiredSubscription from './scan-expired-subscription.js';

export default ({ logger, userService, pfPlanService, notificationService, miscellaneousService } = {}) => [
    deactivateInactiveAccounts({ logger, userService, notificationService }),
    scanPfPlanRetentionPeriod({ logger, pfPlanService }),
    dailyPfPlanReminder({ logger, pfPlanService, notificationService }),
    scanExpiredSubscription({ logger, miscellaneousService }),
];
