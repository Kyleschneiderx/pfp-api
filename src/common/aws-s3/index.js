import aws from '@aws-sdk/client-s3';
import config from '../../configs/aws-s3.js';

const client = new aws.S3Client(config);

export const s3 = aws;

export default client;
