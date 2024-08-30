export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'AccountTypes',
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
            tableName: 'account_types',
            indexes: [],
        },
    );
    return model;
};
