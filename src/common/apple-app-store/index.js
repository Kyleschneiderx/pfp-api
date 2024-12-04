import * as appStore from '@apple/app-store-server-library';
import config from '../../configs/apple-app-store.js';

export const appleAppStoreServerLib = appStore;

const client = new appStore.AppStoreServerAPIClient(
    config.privateKey,
    config.keyId,
    config.issuerId,
    config.bundleId,
    process.env.APP_ENV !== 'production' ? appStore.Environment.PRODUCTION : appStore.Environment.PRODUCTION,
);

export default client;
