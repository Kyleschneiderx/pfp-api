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
            day: {
                type: DataTypes.INTEGER,
            },
            workout_id: {
                type: DataTypes.INTEGER,
                comment: 'see workouts table',
                references: {
                    model: 'workouts',
                    key: 'id',
                },
            },
            education_id: {
                type: DataTypes.INTEGER,
                comment: 'see educations table',
                references: {
                    model: 'educations',
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
            tableName: 'pf_plan_dailies',
            indexes: [
                {
                    name: 'pf_plan_dailies_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'pf_plan_dailies_pf_plan_id_workout_id_day',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }, { name: 'workout_id' }, { name: 'day' }],
                },
                {
                    name: 'pf_plan_dailies_pf_plan_id_education_id_day',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }, { name: 'education_id' }, { name: 'day' }],
                },
            ],
        },
    );
    return model;
};
