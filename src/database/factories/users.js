/* eslint-disable node/no-unpublished-import */
import { faker } from '@faker-js/faker';
import { Password } from '../../utils';

export default ({ Users, UserProfiles }) => ({
    create: async (count = 1) => {
        let created;
        const password = faker.internet.password();
        try {
            created = await Users.bulkCreate(
                Array.from({ length: count }, (_, __) => ({
                    email: faker.internet.email(),
                    password: Password.generate(password),
                    account_type_id: 2,
                    type_id: 1,
                    status_id: 1,
                    user_profile: {
                        name: faker.person.fullName(),
                        description: faker.lorem.paragraph(),
                        birthdate: faker.date.birthdate(),
                        contact_number: faker.phone.number(),
                    },
                })),
                {
                    include: [
                        {
                            model: UserProfiles,
                            as: 'user_profile',
                        },
                    ],
                },
            );

            created = created.map((row) => {
                row.dataValues.password = password;
                return row;
            });
        } catch (error) {
            console.log(error);
        }

        return created.length === 1 ? created[0] : created;
    },
});
