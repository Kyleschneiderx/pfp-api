export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'UserTypes',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            value: {
                type: DataTypes.STRING(50),
            },
        },
        {
            sequelize,
            timestamps: false,
            tableName: 'user_types',
            indexes: [],
        },
    );
    return model;
};
