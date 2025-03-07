export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'PageVisits',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            device_id: {
                type: DataTypes.STRING(100),
            },
            page: {
                type: DataTypes.STRING(100),
            },
            total: {
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
            tableName: 'page_visits',
            indexes: [
                {
                    name: 'page_visits_1',
                    using: 'BTREE',
                    fields: [{ name: 'device_id' }],
                },
                {
                    name: 'page_visits_2',
                    using: 'BTREE',
                    fields: [{ name: 'page' }],
                },
            ],
        },
    );
    return model;
};
