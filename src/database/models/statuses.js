export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'Statuses',
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
            tableName: 'statuses',
            indexes: [],
        },
    );
    return model;
};
