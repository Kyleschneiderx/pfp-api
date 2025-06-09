export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserRecommendedPfPlans',
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
            tableName: 'user_recommended_pf_plans',
            indexes: [
                {
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { PfPlans, UserRecommendedPfPlans } = sequelize.models;

        UserRecommendedPfPlans.belongsTo(PfPlans, { as: 'pf_plan', foreignKey: 'pf_plan_id' });
    };
    return model;
};
