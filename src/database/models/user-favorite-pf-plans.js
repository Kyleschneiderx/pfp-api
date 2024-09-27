export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserFavoritePfPlans',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                comment: 'see users table',
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            pf_plan_id: {
                type: DataTypes.INTEGER,
                comment: 'see pf_plans table',
                references: {
                    model: 'pf_plans',
                    key: 'id',
                },
            },
            is_favorite: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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
            tableName: 'user_favorite_pf_plans',
            indexes: [
                {
                    name: 'user_favorite_pf_plans_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_favorite_pf_plans_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'user_favorite_pf_plans_user_id_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }],
                },
                {
                    name: 'user_favorite_pf_plans_user_id_pf_plan_id_is_favorite',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }, { name: 'is_favorite' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { PfPlans, UserFavoritePfPlans } = sequelize.models;

        UserFavoritePfPlans.belongsTo(PfPlans, { as: 'pf_plans', foreignKey: 'pf_plan_id' });
    };
    return model;
};
