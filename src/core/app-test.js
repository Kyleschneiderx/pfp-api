// eslint-disable-next-line node/no-unpublished-import
import request from 'supertest';
import app from './app.js';
import serviceContainer from './service-container.js';

export const { database } = serviceContainer;

export default request(
    app({
        serviceContainer,
    }),
);
