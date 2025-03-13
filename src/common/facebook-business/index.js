import facebookBusinessSdk from 'facebook-nodejs-business-sdk';
import config from '../../configs/facebook-business.js';

export const facebookAdsApi = facebookBusinessSdk.FacebookAdsApi.init(config.accessToken);

facebookAdsApi.setDebug(true);

export const facebookBusiness = facebookBusinessSdk;

const eventTime = () => Math.floor(Date.now() / 1000);

export default {
    createEvent: async (event, data) =>
        new facebookBusinessSdk.AdsPixel(config.pixelId).createEvent([], {
            data: [
                {
                    event_name: event,
                    event_time: eventTime(),
                    action_source: 'system_generated',
                    ...data,
                },
            ],
        }),
};
