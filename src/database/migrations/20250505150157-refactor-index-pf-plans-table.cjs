module.exports = {
    up: async (queryInterface) => {
        const removeIndexes = ['pf_plans_is_custom', 'pf_plans_is_premium', 'pf_plans_name', 'pf_plans_status_id_is_premium'];

        await Promise.all(
            removeIndexes.map(async (indexName) => {
                await queryInterface.removeIndex('pf_plans', indexName);
            }),
        );

        const indexObject = [
            {
                name: 'pf_plans_1',
                using: 'BTREE',
                fields: [{ name: 'status_id' }, { name: 'is_custom' }],
            },
            {
                name: 'pf_plans_2',
                using: 'BTREE',
                fields: [{ name: 'name' }],
            },
        ];

        await Promise.all(
            indexObject.map(async (index) => {
                await queryInterface.addIndex('pf_plans', index.fields, index);
            }),
        );
    },
    down: async (queryInterface) => {
        const removeIndexes = ['pf_plans_1', 'pf_plans_2'];

        await Promise.all(
            removeIndexes.map(async (indexName) => {
                await queryInterface.removeIndex('pf_plans', indexName);
            }),
        );

        const indexObject = [
            {
                name: 'pf_plans_name',
                using: 'BTREE',
                fields: [{ name: 'name' }],
            },
            {
                name: 'pf_plans_is_premium',
                using: 'BTREE',
                fields: [{ name: 'is_premium' }],
            },
            {
                name: 'pf_plans_status_id_is_premium',
                using: 'BTREE',
                fields: [{ name: 'status_id' }, { name: 'is_premium' }],
            },
            {
                name: 'pf_plans_is_custom',
                using: 'BTREE',
                fields: [{ name: 'is_custom' }],
            },
        ];

        await Promise.all(
            indexObject.map(async (index) => {
                await queryInterface.addIndex('pf_plans', index.fields, index);
            }),
        );
    },
};
