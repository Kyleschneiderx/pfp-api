export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserStreakLogs',
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
            is_workout: {
                type: DataTypes.BOOLEAN,
            },
            is_pf_plan_day: {
                type: DataTypes.BOOLEAN,
            },
            streak_date: {
                type: DataTypes.DATEONLY,
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
            tableName: 'user_streak_logs',
            indexes: [
                {
                    name: 'user_streak_logs_1',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }],
                },
                {
                    name: 'user_streak_logs_2',
                    using: 'BTREE',
                    fields: [{ name: 'user_id' }, { name: 'streak_date' }],
                },
            ],
        },
    );
    model.associate = () => {};
    return model;
};
