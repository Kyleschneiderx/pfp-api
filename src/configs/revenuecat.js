export default {
    apiKey: process.env.REVENUECAT_APIKEY,
    projectId: process.env.REVENUECAT_PROJECT_ID,
    environment: process.env.REVENUECAT_ENVIRONMENT ?? 'TEMP',
};
