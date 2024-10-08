import express from 'express';
import { ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default ({ helper, storage }) => {
    const router = express.Router();

    router.get('/:s3_path/:secret/:s3_file', async (req, res) => {
        if (
            !helper.verifyProtectedUrl(req.params.secret, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, req.params.s3_file.split('.')[0])
        ) {
            throw new exceptions.Unauthorized('Unauthorized');
        }

        const signer = await storage.getS3SignedUrl(`${req.params.s3_path}/${req.params.s3_file}`, {
            expiresIn: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES * 60,
            bucket: process.env.S3_BUCKET_NAME,
        });

        return res.redirect(signer);
    });

    return router;
};
