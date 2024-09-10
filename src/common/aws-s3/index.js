import { S3Client } from '@aws-sdk/client-s3';
import config from '../../configs/aws-s3.js';

const client = new S3Client(config);

export default client;
