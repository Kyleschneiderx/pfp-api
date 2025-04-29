module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkUpdate('exercises', {
            rest: Sequelize.literal('hold'),
        });

        return queryInterface.bulkUpdate('exercises', {
            hold: null,
        });
    },

    down: async (queryInterface, Sequelize) => {},
};
