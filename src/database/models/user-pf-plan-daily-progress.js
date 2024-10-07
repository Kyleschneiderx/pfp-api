export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserPfPlanDailyProgress',
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
            pf_plan_daily_id: {
                type: DataTypes.INTEGER,
                comment: 'see pf_plan_dailies table',
                references: {
                    model: 'pf_plan_dailies',
                    key: 'id',
                },
            },
            pf_plan_daily_content_id: {
                type: DataTypes.INTEGER,
                comment: 'see pf_plan_daily_contents table',
                references: {
                    model: 'pf_plan_daily_contents',
                    key: 'id',
                },
            },
            day: {
                type: DataTypes.INTEGER,
            },
            is_skip: {
                type: DataTypes.BOOLEAN,
            },
            is_fulfilled: {
                type: DataTypes.BOOLEAN,
            },
            total_days: {
                type: DataTypes.INTEGER,
            },
            fulfilled: {
                type: DataTypes.INTEGER,
            },
            unfulfilled: {
                type: DataTypes.INTEGER,
            },
            skipped: {
                type: DataTypes.INTEGER,
            },
            total_contents: {
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
            tableName: 'user_pf_plan_daily_progress',
            indexes: [
                {
                    name: 'user_pf_plan_daily_progress_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_pf_plan_daily_progress_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plan_daily_progress_user_id_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plan_daily_progress_user_id_pf_plan_id_pf_plan_daily_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }, { name: 'pf_plan_daily_id' }],
                },
                {
                    name: 'user_pf_plan_daily_progress_5',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }, { name: 'pf_plan_daily_id' }, { name: 'is_fulfilled' }],
                },
            ],
        },
    );
    return model;
};
