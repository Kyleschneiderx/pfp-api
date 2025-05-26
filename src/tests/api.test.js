import app from '../core/app-test.js';

describe('GET /api', () => {
    it('should return status ok', async () => {
        const res = await app.get('/');
        expect(res.statusCode).toBe(200);
    });
});
