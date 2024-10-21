module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('subscription_packages', [
            {
                id: 1,
                name: 'Monthly',
                short_description: 'Monthly Access',
                description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Cras eleifend sem vel lorem mattis, ut posuere purus auctor.
Mauris vestibulum lacus et ex efficitur posuere.
Nulla non nisl scelerisque, pharetra augue ut, porttitor velit.
Quisque volutpat dui et tortor aliquam hendrerit.`,
                price: 399,
                discounted_price: null,
                is_recommended: false,
                reference: '',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Annual',
                short_description: 'Discounted Annual Fee',
                description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Cras eleifend sem vel lorem mattis, ut posuere purus auctor.
Mauris vestibulum lacus et ex efficitur posuere.
Nulla non nisl scelerisque, pharetra augue ut, porttitor velit.
Quisque volutpat dui et tortor aliquam hendrerit.`,
                price: 5099,
                discounted_price: 2499,
                is_recommended: true,
                reference: '',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('subscription_packages', null, {}),
};
