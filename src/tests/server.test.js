import app from '../core/app-test.js';

describe('GET /', () => {
    it('should return status ok', async () => {
        const res = await app.get('/');
        expect(res.statusCode).toBe(200);
    });
});
