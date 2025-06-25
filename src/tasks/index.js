import deactivateInactiveAccounts from './deactivate-inactive-accounts.js';
import scanPfPlanRetentionPeriod from './scan-pf-plan-retention-period.js';
import dailyPfPlanReminder from './daily-pf-plan-reminder.js';
import newNonSubscriberUsersReminder from './new-non-subscriber-users-reminder.js';
import newSubscriberUsersReminder from './new-subscriber-users-reminder.js';

export default ({ logger, userService, pfPlanService, notificationService } = {}) => [
    deactivateInactiveAccounts({ logger, userService, notificationService }),
    scanPfPlanRetentionPeriod({ logger, pfPlanService }),
    dailyPfPlanReminder({ logger, pfPlanService, notificationService }),
    newNonSubscriberUsersReminder({ logger, userService, notificationService }),
    newSubscriberUsersReminder({ logger, userService, notificationService }),
];
