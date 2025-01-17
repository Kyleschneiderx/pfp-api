import { v4 as uuid } from 'uuid';

export default class Storage {
    constructor({ logger, driver, file, s3 = undefined, s3PreSigner = undefined }) {
        this.driver = driver;
        this.logger = logger;
        this.s3 = s3;
        this.s3PreSigner = s3PreSigner;
        this.file = file;
    }

    /**
     * Store file to storage
     *
     * @param {string} name File name
     * @param {string} data File data. Buffer | Filepath
     * @param {string} path Base path where to store file
     * @param {object=} options
     */
    async store(name, data, path, options = {}) {
        if (data === undefined) return {};

        try {
            let extension = false;

            if (name !== undefined && options?.contentType === undefined) {
                extension = this.file.extractExtension(name);
            }

            if (options?.contentType !== undefined) {
                extension = this.file.getExtensionByMimeType(options?.contentType);
            }

            if (!extension) throw new Error('Failed to get extension from file name or content type.');

            if (name === undefined) {
                name = `${uuid()}.${extension}`;
            }

            const fileName = `${uuid()}.${extension}`;

            const s3Response = await this.driver.send(
                new this.s3.PutObjectCommand({
                    Bucket: options?.s3?.bucket,
                    Key: `${path}/${fileName}`,
                    Body: data,
                    ContentType: options?.contentType,
                }),
            );

            return {
                originalFilename: name,
                fileName: fileName,
                path: `${path}/${fileName}`,
                s3: s3Response,
            };
        } catch (error) {
            console.log(error);
            this.logger.error('Failed to store file.');

            throw new Error('Failed to store file.', { cause: error });
        }
    }

    /**
     * Remove file from storage
     *
     * @param {string[]|string} path Path to file
     * @param {object=} options
     */
    async delete(path, options = {}) {
        if (!path || path === undefined || path?.length === 0) return [];
        try {
            if (!Array.isArray(path)) path = [path];

            return await Promise.all(
                path.map(async (each) => {
                    let bucketUrl;
                    if (each.includes('amazonaws.com/')) {
                        bucketUrl = each.split('amazonaws.com/');
                    }

                    return this.driver.send(
                        new this.s3.DeleteObjectCommand({
                            Bucket: options?.s3?.bucket,
                            Key: bucketUrl?.[1] ?? each,
                        }),
                    );
                }),
            );
        } catch (error) {
            this.logger.error('Failed to delete file.');

            throw new Error('Failed to delete file.', { cause: error });
        }
    }

    /**
     * Generate signed object url for s3
     * @param {string} path Path to file
     * @param {object} options
     * @param {string=} options.bucket Bucket name
     * @param {number=} options.expiresIn Expiration time in seconds
     * @returns
     */
    async getS3SignedUrl(path, options = {}) {
        try {
            return this.s3PreSigner.getSignedUrl(
                this.driver,
                new this.s3.GetObjectCommand({
                    Bucket: options?.bucket,
                    Key: path,
                }),
                {
                    expiresIn: options?.expiresIn ?? 3600,
                },
            );
        } catch (error) {
            console.log(error);
            this.logger.error('Failed to get signed url.');

            throw new Error('Failed to get signed url.', { cause: error });
        }
    }
}
