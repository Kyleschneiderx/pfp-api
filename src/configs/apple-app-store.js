export default {
    issuerId: process.env.APPLE_APP_STORE_ISSUER_ID,
    keyId: process.env.APPLE_APP_STORE_KEY_ID,
    bundleId: process.env.APPLE_APP_STORE_BUNDLE_ID,
    privateKey: process.env.APPLE_APP_STORE_SECRET.replace(/\\n/g, '\n'),
};
