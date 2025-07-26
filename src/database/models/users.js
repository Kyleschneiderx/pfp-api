export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'Users',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING(150),
            },
            password: {
                type: DataTypes.STRING(150),
            },
            guest_id: {
                type: DataTypes.STRING(150),
            },
            type_id: {
                type: DataTypes.INTEGER,
                comment: 'see users_types table',
                references: {
                    model: 'user_types',
                    key: 'id',
                },
            },
            account_type_id: {
                type: DataTypes.INTEGER,
                comment: 'see account_types table',
                references: {
                    model: 'account_types',
                    key: 'id',
                },
            },
            google_id: {
                type: DataTypes.STRING(100),
            },
            apple_id: {
                type: DataTypes.STRING(100),
            },
            status_id: {
                type: DataTypes.INTEGER,
                comment: 'see statuses table',
                references: {
                    model: 'statuses',
                    key: 'id',
                },
            },
            last_login_at: {
                type: DataTypes.DATE,
            },
            verified_at: {
                type: DataTypes.DATE,
            },
            created_at: {
                type: DataTypes.DATE,
            },
            updated_at: {
                type: DataTypes.DATE,
            },
            deleted_at: {
                type: DataTypes.DATE,
            },
        },
        {
            sequelize,
            tableName: 'users',
            indexes: [
                {
                    name: 'users_email',
                    using: 'BTREE',
                    fields: [{ name: 'email' }],
                },
                {
                    name: 'users_account_type_id',
                    using: 'BTREE',
                    fields: [{ name: 'account_type_id' }],
                },
                {
                    name: 'users_type_id',
                    using: 'BTREE',
                    fields: [{ name: 'type_id' }],
                },
                {
                    name: 'users_status_id',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }],
                },
            ],
            scopes: {
                withProfile: () => ({
                    include: [
                        {
                            model: sequelize.models.UserProfiles,
                            as: 'user_profile',
                            attributes: {
                                exclude: [],
                            },
                            where: {},
                        },
                    ],
                }),
            },
        },
    );
    model.associate = () => {
        const { Users, UserProfiles, UserTypes, AccountTypes, Statuses } = sequelize.models;

        Users.hasOne(UserProfiles, { as: 'user_profile', foreignKey: 'user_id' });

        Users.belongsTo(UserTypes, { as: 'user_type', foreignKey: 'type_id' });

        Users.belongsTo(Statuses, { as: 'status', foreignKey: 'status_id' });

        Users.belongsTo(AccountTypes, { as: 'account_type', foreignKey: 'account_type_id' });
    };
    return model;
};
