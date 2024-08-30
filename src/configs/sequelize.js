import 'dotenv/config';

// eslint-disable-next-line import/prefer-default-export
export default {
    settings: {
        dialect: process.env.DB_DIALECT,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        logging: false,
        timezone: '+00:00',
        define: {
            charset: 'utf8',
            timestamps: true,
            underscored: true,
            freezeTableName: true,
            paranoid: true,
            deletedAt: 'deleted_at',
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        seederStorage: 'sequelize',
    },
};
