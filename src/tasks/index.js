import deactivateInactiveAccounts from './deactivate-inactive-accounts.js';
import scanPfPlanRetentionPeriod from './scan-pf-plan-retention-period.js';

export default ({ logger, userService, pfPlanService } = {}) => [
    deactivateInactiveAccounts({ logger, userService }),
    scanPfPlanRetentionPeriod({ logger, pfPlanService }),
];
