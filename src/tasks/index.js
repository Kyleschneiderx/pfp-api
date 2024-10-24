import deactivateInactiveAccounts from './deactivate-inactive-accounts.js';
import scanPfPlanRetentionPeriod from './scan-pf-plan-retention-period.js';

export default ({ logger, userService, pfPlanService, notificationService } = {}) => [
    deactivateInactiveAccounts({ logger, userService, notificationService }),
    scanPfPlanRetentionPeriod({ logger, pfPlanService }),
];
