module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert('app_static_contents', [
            {
                id: 4,
                key: 'privacy_policy',
                content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus nec ante ornare, finibus dolor a, sollicitudin purus. Donec id dui ipsum. Morbi eleifend ornare molestie. Aliquam erat volutpat. Vestibulum sollicitudin elit ac quam gravida dapibus. Curabitur cursus vehicula mi nec dignissim. Maecenas tristique tempor ultrices. Pellentesque vitae rutrum ante.

Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis vel viverra ex. Duis et ultricies nibh. Nam a commodo lorem. In a turpis interdum, gravida est a, mollis libero. Pellentesque consectetur in quam a imperdiet. Donec congue dui a erat ultricies auctor. Fusce et ante sed justo hendrerit posuere. Pellentesque non quam quam. Interdum et malesuada fames ac ante ipsum primis in faucibus. Integer vitae ex sed sapien efficitur aliquam. Curabitur augue mi, faucibus ut venenatis ut, ornare vel nibh. Vivamus egestas feugiat varius. Proin a nulla mi. Ut dapibus, felis id tincidunt dictum, enim nisi sollicitudin dolor, sed dapibus tellus ipsum vitae elit. Fusce neque libero, varius in velit id, consectetur tincidunt odio.`,
            },
            {
                id: 5,
                key: 'about_app',
                content: `Vivamus ornare auctor lacus, sit amet consequat velit aliquam sit amet. Sed venenatis, magna vel maximus venenatis, orci odio eleifend diam, ut tincidunt turpis neque gravida metus. Sed eleifend ligula felis, id venenatis massa hendrerit in. Phasellus sodales tellus odio, sit amet tincidunt augue rutrum vel. Fusce bibendum eros sapien, sit amet ullamcorper ligula pharetra ac. Pellentesque tempus ipsum et ligula ultrices lobortis. Integer consequat mattis accumsan.

Cras sed scelerisque elit. Praesent viverra, elit nec condimentum ornare, arcu arcu lacinia lectus, id tristique nisl mi eget quam. Duis risus odio, laoreet a arcu sed, feugiat euismod nisl. Nulla quis sagittis neque, vel euismod felis. Curabitur malesuada, diam ultrices accumsan tincidunt, tellus felis efficitur justo, non consequat ante nisi a enim. Donec vitae sapien a ex vestibulum congue. Sed at quam at dui maximus eleifend at vel tellus. Vivamus rhoncus elit id ultricies vulputate. Phasellus volutpat, leo placerat vulputate scelerisque, metus enim tristique risus, sit amet aliquam lectus urna a neque. Praesent finibus sagittis semper. Sed facilisis ac elit tincidunt dictum. Integer eleifend sem accumsan malesuada dignissim. Donec lobortis, dui a consectetur fermentum, ipsum elit pellentesque metus, sed aliquam eros leo non lectus. Nulla aliquam non arcu eget tristique. Morbi viverra eu nunc at ultricies. Duis odio nisl, vulputate vel auctor vel, lacinia et sapien.`,
            },
        ]),

    down: (queryInterface, Sequelize) => queryInterface.bulkDelete('app_static_contents', null, {}),
};
