export default ({ logger, pfPlanService }) => {
    const name = 'Scan PF Plan Retention Period';

    return {
        name: name,
        schedule: '0 0 * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                await pfPlanService.resetPfPlanProgressElapsedRetentionPeriod();
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
