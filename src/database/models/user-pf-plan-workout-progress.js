export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserPfPlanWorkoutProgress',
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
            workout_id: {
                type: DataTypes.INTEGER,
                comment: 'see workouts table',
                references: {
                    model: 'workouts',
                    key: 'id',
                },
            },
            workout_exercise_id: {
                type: DataTypes.INTEGER,
                comment: 'see workout_exercises table',
                references: {
                    model: 'workout_exercises',
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
            fulfilled: {
                type: DataTypes.INTEGER,
            },
            unfulfilled: {
                type: DataTypes.INTEGER,
            },
            total_exercise: {
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
            tableName: 'user_pf_plan_workout_progress',
            indexes: [
                {
                    name: 'user_pf_plans_workout_progress_user_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_pf_plans_workout_progress_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plans_workout_progress_user_id_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }],
                },
                {
                    name: 'user_pf_plans_workout_progress_user_id_workout_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'workout_id' }],
                },
                {
                    name: 'user_pf_plans_workout_progress_pf_plan_id_workout_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }, { name: 'workout_id' }],
                },
                {
                    name: 'user_pf_plans_workout_progress_user_id_pf_plan_id_workout_id',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }, { name: 'workout_id' }],
                },
                {
                    name: 'user_pf_plans_workout_progress_userid_pfplanid_pfplandailyid',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'pf_plan_id' }, { name: 'pf_plan_daily_id' }],
                },
            ],
        },
    );
    return model;
};
