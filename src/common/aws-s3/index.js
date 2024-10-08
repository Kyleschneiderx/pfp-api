import aws from '@aws-sdk/client-s3';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';
import config from '../../configs/aws-s3.js';

const client = new aws.S3Client(config);

export const s3 = aws;

export const s3PreSigner = s3RequestPresigner;

export default client;
