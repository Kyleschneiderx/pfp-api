import deactivateInactiveAccounts from './deactivate-inactive-accounts.js';
import scanPfPlanRetentionPeriod from './scan-pf-plan-retention-period.js';
import dailyPfPlanReminder from './daily-pf-plan-reminder.js';
import imageOptimization from './image-optimization.js';

export default ({ logger, userService, pfPlanService, notificationService, miscellaneousService, database, file, storage } = {}) => [
    deactivateInactiveAccounts({ logger, userService, notificationService }),
    scanPfPlanRetentionPeriod({ logger, pfPlanService }),
    dailyPfPlanReminder({ logger, pfPlanService, notificationService }),
    imageOptimization({ logger, database, file, storage }),
];
