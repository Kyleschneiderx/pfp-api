export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'PfPlanDailyContents',
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
            pf_plan_daily_id: {
                type: DataTypes.INTEGER,
                comment: 'see pf_plan_dailies table',
                references: {
                    model: 'pf_plan_dailies',
                    key: 'id',
                },
            },
            exercise_id: {
                type: DataTypes.INTEGER,
                comment: 'see exercises table',
                references: {
                    model: 'exercises',
                    key: 'id',
                },
            },
            sets: {
                type: DataTypes.INTEGER,
            },
            reps: {
                type: DataTypes.INTEGER,
            },
            hold: {
                comment: 'in seconds',
                type: DataTypes.INTEGER,
            },
            rest: {
                comment: 'in seconds',
                type: DataTypes.INTEGER,
            },
            education_id: {
                type: DataTypes.INTEGER,
                comment: 'see educations table',
                references: {
                    model: 'educations',
                    key: 'id',
                },
            },
            arrangement: {
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
            tableName: 'pf_plan_daily_contents',
            indexes: [
                {
                    name: 'pf_plan_daily_contents_pf_plan_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }],
                },
                {
                    name: 'pf_plan_daily_contents_pf_plan_daily_id',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_daily_id' }],
                },
                {
                    name: 'pf_plan_daily_contents_pfplanid_pfplandailyid_exerciseid',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }, { name: 'pf_plan_daily_id' }, { name: 'exercise_id' }],
                },
                {
                    name: 'pf_plan_daily_contents_pfplanid_pfplandailyid_educationid',
                    using: 'BTREE',
                    fields: [{ name: 'pf_plan_id' }, { name: 'pf_plan_daily_id' }, { name: 'education_id' }],
                },
                {
                    name: 'pf_plan_daily_contents_arrangement',
                    using: 'BTREE',
                    fields: [{ name: 'arrangement' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { PfPlanDailyContents, PfPlanDailies, Exercises, Educations, UserPfPlanDailyProgress } = sequelize.models;

        PfPlanDailyContents.belongsTo(PfPlanDailies, { as: 'pf_plan_dailies', foreignKey: 'pf_plan_daily_id' });

        PfPlanDailyContents.belongsTo(Exercises, { as: 'exercise', foreignKey: 'exercise_id' });

        PfPlanDailyContents.belongsTo(Educations, { as: 'education', foreignKey: 'education_id' });

        PfPlanDailyContents.hasMany(UserPfPlanDailyProgress, { as: 'user_pf_plan_daily_progress', foreignKey: 'pf_plan_daily_content_id' });
    };
    return model;
};
