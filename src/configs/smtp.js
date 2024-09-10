export default {
    ses: {
        apiVersion: '2010-12-01',
        region: process.env.SMTP_REGION,
        credentials: {
            accessKeyId: process.env.SMTP_USER,
            secretAccessKey: process.env.SMTP_PASSWORD,
        },
    },
};
