export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'PfPlanDailies',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            pf_plan_id: {
                type: DataTypes.INTEGER,
                comment: 'see pf_plans table',
                references: {
                    model: 'pf_plans',
                    key: 'id',
                },
            },
            name: {
                type: DataTypes.STRING(200),
            },
            day: {
                type: DataTypes.INTEGER,
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
            tableName: 'pf_plan_dailies',
            indexes: [
                {
                    name: 'pf_plan_dailies_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'pf_plan_dailies_name',
                    using: 'BTREE',
                    fields: [{ name: 'name' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { PfPlanDailies, PfPlanDailyContents, UserPfPlanDailyProgress } = sequelize.models;

        PfPlanDailies.hasOne(UserPfPlanDailyProgress, { as: 'user_pf_plan_daily_progress', foreignKey: 'pf_plan_daily_id' });

        PfPlanDailies.hasMany(PfPlanDailyContents, { as: 'pf_plan_daily_contents', foreignKey: 'pf_plan_daily_id' });
    };
    return model;
};
