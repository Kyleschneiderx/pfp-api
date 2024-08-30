export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'ExerciseCategories',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            value: {
                type: DataTypes.STRING(150),
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
            tableName: 'exercise_categories',
            indexes: [],
        },
    );
    return model;
};
