module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkUpdate('pf_plan_daily_contents', {
            rest: Sequelize.literal('hold'),
        });

        return queryInterface.bulkUpdate('pf_plan_daily_contents', {
            hold: null,
        });
    },

    down: async (queryInterface, Sequelize) => {},
};
