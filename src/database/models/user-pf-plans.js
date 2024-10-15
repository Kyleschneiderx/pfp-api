export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserPfPlans',
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
            reset_at: {
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
            tableName: 'user_pf_plans',
            indexes: [
                {
                    name: 'user_pf_plans_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_pf_plans_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plans_user_id_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { PfPlans, UserPfPlans } = sequelize.models;

        UserPfPlans.belongsTo(PfPlans, { as: 'pf_plan', foreignKey: 'pf_plan_id' });
    };
    return model;
};
