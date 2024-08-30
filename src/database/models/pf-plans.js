export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'PfPlans',
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
            tableName: 'pf_plans',
            indexes: [
                {
                    name: 'pf_plans_status_id',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }],
                },
                {
                    name: 'pf_plans_name',
                    using: 'BTREE',
                    fields: [{ name: 'name' }],
                },
            ],
        },
    );
    return model;
};
