import app, { database } from '../core/app-test.js';
import { userFactory } from '../database/factories/index.js';

describe('User Auth Resource', () => {
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
    });
});
