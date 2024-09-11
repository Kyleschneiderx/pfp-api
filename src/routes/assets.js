import express from 'express';
import { S3_OBJECT_URL } from '../constants/index.js';

export default () => {
    const router = express.Router();

    router.get('/:s3_path/:s3_file', (req, res) => res.redirect(`${S3_OBJECT_URL}/${req.params.s3_path}/${req.params.s3_file}`));

    return router;
};
