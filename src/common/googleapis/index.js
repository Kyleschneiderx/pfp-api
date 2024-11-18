import * as googleApisLib from 'googleapis';
import config from '../../configs/googleapis.js';

export const googleApis = googleApisLib;

const auth = new googleApisLib.google.auth.GoogleAuth({
    credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

const googleAuthClient = await auth.getClient();

export default googleAuthClient;
