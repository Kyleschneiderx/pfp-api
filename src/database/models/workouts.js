export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'Workouts',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(300),
            },
            description: {
                type: DataTypes.TEXT,
            },
            is_premium: {
                type: DataTypes.BOOLEAN,
            },
            status_id: {
                type: DataTypes.INTEGER,
                comment: 'see statuses table',
                references: {
                    model: 'statuses',
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
            tableName: 'workouts',
            indexes: [
                {
                    name: 'workouts_status_id',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }],
                },
                {
                    name: 'workouts_name',
                    using: 'BTREE',
                    fields: [{ name: 'name' }],
                },
                {
                    name: 'workouts_status_id_name',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }, { name: 'name' }],
                },
                {
                    name: 'workouts_is_premium',
                    using: 'BTREE',
                    fields: [{ name: 'is_premium' }],
                },
                {
                    name: 'workouts_status_id_is_premium',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }, { name: 'is_premium' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { WorkoutExercises, Statuses, Workouts } = sequelize.models;

        Workouts.hasMany(WorkoutExercises, { as: 'workout_exercises', foreignKey: 'workout_id' });

        Workouts.hasOne(WorkoutExercises, { as: 'workout_exercise', foreignKey: 'workout_id' });

        Workouts.belongsTo(Statuses, { as: 'status', foreignKey: 'status_id' });
    };
    return model;
};
