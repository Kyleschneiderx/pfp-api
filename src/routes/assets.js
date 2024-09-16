import express from 'express';
import fetch from 'node-fetch';
import { S3_OBJECT_URL } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default ({ helper }) => {
    const router = express.Router();

    router.get('/:s3_path/:secret/:s3_file', async (req, res) => {
        if (
            !helper.verifyProtectedUrl(req.params.secret, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, req.params.s3_file.split('.')[0])
        ) {
            throw new exceptions.Unauthorized('Unauthorized');
        }

        const { range } = req.headers;
        try {
            const response = await fetch(`${S3_OBJECT_URL}/${req.params.s3_path}/${req.params.s3_file}`);
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            if (range) {
                const [start, end] = range.replace(/bytes=/, '').split('-');
                const startByte = parseInt(start, 10);
                const endByte = end ? parseInt(end, 10) : Math.min(contentLength - 1, startByte + 10 ** 12); // Default to 1MB chunk

                res.writeHead(206, {
                    'Content-Range': `bytes ${startByte}-${endByte}/${contentLength}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': endByte - startByte + 1,
                    'Content-Type': contentType,
                });
                response.body.pipe(res);
            } else {
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Length', contentLength);
                response.body.pipe(res);
            }
        } catch (error) {
            throw new exceptions.InternalServerError('File not found.', error);
        }
    });

    return router;
};
