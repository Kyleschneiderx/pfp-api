export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'WorkoutDays',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            workout_id: {
                type: DataTypes.INTEGER,
                comment: 'see workouts table',
                references: {
                    model: 'workouts',
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
            day: {
                type: DataTypes.INTEGER,
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
            tableName: 'workout_days',
            indexes: [
                {
                    name: 'workout_days_workout_id',
                    using: 'BTREE',
                    fields: [{ name: 'workout_id' }],
                },
                {
                    name: 'workout_days_workout_id_exercise_id',
                    using: 'BTREE',
                    fields: [{ name: 'workout_id' }, { name: 'exercise_id' }],
                },
                {
                    name: 'workout_days_workout_id_exercise_id_day',
                    using: 'BTREE',
                    fields: [{ name: 'workout_id' }, { name: 'exercise_id' }, { name: 'day' }],
                },
            ],
        },
    );
    return model;
};
