export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'SystemAuditDescriptions',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            description: {
                type: DataTypes.STRING(255),
            },
        },
        {
            sequelize,
            timestamps: false,
            tableName: 'system_audit_descriptions',
            indexes: [],
        },
    );
    return model;
};
