export default ({ logger, miscellaneousService }) => {
    const name = 'Queue Subscription Check';

    return {
        name: name,
        schedule: '*/1 * * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                await miscellaneousService.queueSubscriptionCheck();
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
