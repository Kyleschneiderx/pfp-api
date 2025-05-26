import app, { database } from '../core/app-test.js';
import { userFactory } from '../database/factories/index.js';

describe('App Auth Resource', () => {
    describe('POST /api/v1/auths/login/user', () => {
        it('should authenticate user', async () => {
            const user = await userFactory.create();
            const payload = {
                email: user.email,
                password: user.password,
            };
            const res = await app.post('/api/v1/auths/login/user').send(payload);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should authenticate admin', async () => {
            const payload = {
                email: 'admin@lakecitypt.com',
                password: 'password1W!',
            };
            const res = await app.post('/api/v1/auths/login/admin').send(payload);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should return error on admin authentication in user endpoint', async () => {
            const payload = {
                email: 'admin@lakecitypt.com',
                password: 'password1W!',
            };
            const res = await app.post('/api/v1/auths/login/user').send(payload);
            expect(res.statusCode).toBe(400);
        });

        it('should return error on user authentication in admin endpoint', async () => {
            const user = await userFactory.create();
            const payload = {
                email: user.email,
                password: user.password,
            };
            const res = await app.post('/api/v1/auths/login/admin').send(payload);
            expect(res.statusCode).toBe(400);
        });

        it('should return error on incorrect password', async () => {
            const user = await userFactory.create();
            const payload = {
                email: user.email,
                password: '123123123',
            };
            const res = await app.post('/api/v1/auths/login/user').send(payload);
            expect(res.statusCode).toBe(400);
        });

        it('should return error on incorrect email', async () => {
            const user = await userFactory.create();
            const payload = {
                email: 'test@email.com123',
                password: user.password,
            };
            const res = await app.post('/api/v1/auths/login/user').send(payload);
            expect(res.statusCode).toBe(400);
        });
    });
});
