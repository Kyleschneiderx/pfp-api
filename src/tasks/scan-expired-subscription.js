export default ({ logger, miscellaneousService }) => {
    const name = 'Scan Expired Subscription';

    return {
        name: name,
        schedule: '0 0 * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                await miscellaneousService.expireUserSubscriptions();
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
