export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'ApiLogs',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            endpoint: {
                type: DataTypes.STRING(300),
            },
            method: {
                type: DataTypes.STRING(15),
            },
            ip: {
                type: DataTypes.STRING(100),
            },
            request_header: {
                type: DataTypes.TEXT,
            },
            request: {
                type: DataTypes.TEXT,
            },
            response_header: {
                type: DataTypes.TEXT,
            },
            response: {
                type: DataTypes.TEXT,
            },
            status_code: {
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
            tableName: 'api_logs',
            indexes: [
                {
                    name: 'api_logs_endpoint',
                    using: 'BTREE',
                    fields: [{ name: 'endpoint' }],
                },
                {
                    name: 'api_logs_method',
                    using: 'BTREE',
                    fields: [{ name: 'method' }],
                },
                {
                    name: 'api_logs_ip',
                    using: 'BTREE',
                    fields: [{ name: 'ip' }],
                },
                {
                    name: 'api_logs_endpoint_method',
                    using: 'BTREE',
                    fields: [{ name: 'endpoint' }, { name: 'method' }],
                },
                {
                    name: 'api_logs_endpoint_method_ip',
                    using: 'BTREE',
                    fields: [{ name: 'endpoint' }, { name: 'method' }, { name: 'ip' }],
                },
            ],
        },
    );
    return model;
};
