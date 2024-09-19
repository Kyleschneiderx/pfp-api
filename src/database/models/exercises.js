export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'Exercises',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(200),
            },
            category_id: {
                type: DataTypes.INTEGER,
                comment: 'see exercise_categories table',
                references: {
                    model: 'exercise_categories',
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
            description: {
                type: DataTypes.STRING(200),
            },
            how_to: {
                type: DataTypes.TEXT,
            },
            photo: {
                type: DataTypes.STRING(250),
            },
            video: {
                type: DataTypes.STRING(250),
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
            tableName: 'exercises',
            indexes: [
                {
                    name: 'exercises_name',
                    using: 'BTREE',
                    fields: [{ name: 'name' }],
                },
                {
                    name: 'exercises_category_id',
                    using: 'BTREE',
                    fields: [{ name: 'category_id' }],
                },
            ],
        },
    );
    model.associate = () => {
        const { Exercises, ExerciseCategories } = sequelize.models;

        Exercises.belongsTo(ExerciseCategories, { as: 'exercise_category', foreignKey: 'category_id' });
    };
    return model;
};
