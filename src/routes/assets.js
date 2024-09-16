import express from 'express';
import { S3_OBJECT_URL } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default ({ helper }) => {
    const router = express.Router();

    router.get('/:s3_path/:secret/:s3_file', async (req, res) => {
        if (
            !helper.verifyProtectedUrl(req.params.secret, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, req.params.s3_file.split('.')[0])
        ) {
            throw new exceptions.Unauthorized('File not found.');
        }

        try {
            const response = await fetch(`${S3_OBJECT_URL}/${req.params.s3_path}/${req.params.s3_file}`);
            const contentType = response.headers.get('content-type');
            const arrayBuffer = await response.arrayBuffer();
            return res
                .set({
                    'Content-Type': contentType,
                })
                .send(Buffer.from(arrayBuffer));
        } catch (error) {
            throw new exceptions.InternalServerError('File not found.', error);
        }
    });

    return router;
};
