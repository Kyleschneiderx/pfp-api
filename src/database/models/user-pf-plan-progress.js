export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserPfPlanProgress',
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
            day: {
                type: DataTypes.INTEGER,
            },
            has_skip: {
                type: DataTypes.BOOLEAN,
            },
            is_fulfilled: {
                type: DataTypes.BOOLEAN,
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
            tableName: 'user_pf_plan_progress',
            indexes: [
                {
                    name: 'user_pf_plan_progress_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_pf_plan_progress_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plan_progress_user_id_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plan_progress_user_id_pf_plan_id_day',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }, { name: 'day' }],
                },
            ],
        },
    );
    return model;
};
