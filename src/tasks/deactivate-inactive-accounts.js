export default ({ logger, userService }) => {
    const name = 'Deactivate Inactive Accounts';

    return {
        name: name,
        schedule: '* * * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                await userService.deactivateInactiveAccounts();
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
