import express from 'express';
import { S3_OBJECT_URL, S3_PUBLIC_PATHS } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default ({ helper }) => {
    const router = express.Router();

    router.get('/:env/:s3_path/:s3_file', async (req, res) => {
        if (!S3_PUBLIC_PATHS.includes(req.params.s3_path)) {
            throw new exceptions.Unauthorized('Unauthorized');
        }

        return res.redirect(`${S3_OBJECT_URL}/${req.params.env}/${req.params.s3_path}/${req.params.s3_file}`);
    });

    router.get('/:env/:s3_path/:secret/:s3_file', async (req, res) => {
        if (!helper.verifyProtectedUrl(req.params.secret, req.params.s3_file.split('.')[0])) {
            throw new exceptions.Unauthorized('Unauthorized');
        }

        return res.redirect(`${S3_OBJECT_URL}/${req.params.env}/${req.params.s3_path}/${req.params.s3_file}`);
    });

    return router;
};
