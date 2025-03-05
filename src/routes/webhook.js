import express from 'express';
import { S3_OBJECT_URL } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default ({ helper }) => {
    const router = express.Router();

    router.use(
        express.json({
            limit: '100mb',
        }),
    );

    router.use(
        express.urlencoded({
            extended: true,
            limit: '100mb',
        }),
    );

    router.post('/revenuecat', async (req, res) => {
        console.log(req.body);

        return res.json({ a: 'a' });
    });

    return router;
};
