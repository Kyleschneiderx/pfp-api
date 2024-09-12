export default {
    standard: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    ses: {
        apiVersion: '2010-12-01',
        region: process.env.SMTP_REGION,
        credentials: {
            accessKeyId: process.env.SMTP_USER,
            secretAccessKey: process.env.SMTP_PASSWORD,
        },
    },
};
