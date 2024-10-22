export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'WorkoutExercises',
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
            tableName: 'workout_exercises',
            indexes: [
                {
                    name: 'workout_exercises_workout_id',
                    using: 'BTREE',
                    fields: [{ name: 'workout_id' }],
                },
                {
                    name: 'workout_exercises_workout_id_exercise_id',
                    using: 'BTREE',
                    fields: [{ name: 'workout_id' }, { name: 'exercise_id' }],
                },
                {
                    name: 'workout_exercises_arrangement',
                    using: 'BTREE',
                    fields: [{ name: 'arrangement' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { WorkoutExercises, Exercises } = sequelize.models;

        WorkoutExercises.belongsTo(Exercises, { as: 'exercise', foreignKey: 'exercise_id' });
    };
    return model;
};
