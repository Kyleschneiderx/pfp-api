export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'VerificationCodes',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING(150),
            },
            code: {
                type: DataTypes.STRING(6),
            },
            attempt: {
                type: DataTypes.INTEGER,
            },
            verified_at: {
                type: DataTypes.DATE,
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
            tableName: 'verification_codes',
            indexes: [
                {
                    name: 'verification_codes_email',
                    using: 'BTREE',
                    fields: [{ name: 'email' }],
                },
                {
                    name: 'verification_codes_email_code',
                    using: 'BTREE',
                    fields: [{ name: 'email' }, { name: 'code' }],
                },
                {
                    name: 'verification_codes_code',
                    using: 'BTREE',
                    fields: [{ name: 'code' }],
                },
            ],
        },
    );

    return model;
};
