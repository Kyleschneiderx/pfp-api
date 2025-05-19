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
     * Upload content to s3 using multipart
     * @param {string|Buffer} data
     * @param {object} options
     * @param {string} options.bucket Bucket name
     * @param {string} options.key File name
     * @param {string} options.contentType File content type
     *
     */
    async uploadS3MultiPart(data, options) {
        let uploadId;
        try {
            const multipartUpload = await this.driver.send(
                new this.s3.CreateMultipartUploadCommand({
                    Bucket: options.bucket,
                    Key: options.key,
                    ContentType: options.contentType,
                }),
            );

            const minimumPart = 100 * 1024 * 1024;

            const partSize = Math.max(Math.ceil(data.length / 100), minimumPart);

            const numberParts = Math.ceil(data.length / partSize);

            const uploadParts = [];

            uploadId = multipartUpload.UploadId;

            for (let i = 0; i < numberParts; i += 1) {
                const start = i * partSize;
                const end = Math.min(start + partSize, data.length);

                uploadParts.push(
                    this.driver
                        .send(
                            new this.s3.UploadPartCommand({
                                Bucket: options.bucket,
                                Key: options.key,
                                UploadId: uploadId,
                                Body: data.slice(start, end),
                                PartNumber: i + 1,
                            }),
                        )
                        .then((d) => d),
                );
            }

            const uploadPartsResult = await Promise.all(uploadParts);

            await this.driver.send(
                new this.s3.CompleteMultipartUploadCommand({
                    Bucket: options.bucket,
                    Key: options.key,
                    UploadId: uploadId,
                    MultipartUpload: {
                        Parts: uploadPartsResult.map(({ ETag }, i) => ({
                            ETag,
                            PartNumber: i + 1,
                        })),
                    },
                }),
            );
        } catch (error) {
            if (uploadId) {
                await this.driver.send(
                    new this.s3.AbortMultipartUploadCommand({
                        Bucket: options.bucket,
                        Key: options.key,
                        UploadId: uploadId,
                    }),
                );
            }
            this.logger.error('Failed to upload data using multipart.');

            throw new Error('Failed to upload data using multipart.', { cause: error });
        }
    }

    /**
     * Store file to storage
     *
     * @param {string} name File name
     * @param {string} data File data. Buffer | Filepath
     * @param {string} path Base path where to store file
     * @param {object=} options
     */
    async basicStore(name, data, path, options = {}) {
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
                    CacheControl: 'max-age=31536000',
                }),
            );

            return {
                originalFilename: name,
                fileName: fileName,
                path: `${path}/${fileName}`,
                s3: s3Response,
            };
        } catch (error) {
            this.logger.error('Failed to store file.');

            throw new Error('Failed to store file.', { cause: error });
        }
    }

    /**
     * Store file to storage
     *
     * @param {object|Buffer} file File object or buffer
     * @param {string} path Base path where to store file
     * @param {object=} options
     * @param {object=} options.s3 S3 options
     * @param {string=} options.s3.bucket S3 bucket name
     * @param {string=} options.contentType File content type
     * @param {string=} options.fileName File name to use without the extension
     * @param {boolean=} options.preserveName Use the name in the file object if set to true
     * @param {string=} options.convertTo Convert image file to a specific format/content type (images only)
     */
    async store(file, path, options = {}) {
        if (file === undefined) return {};

        try {
            let data = file;

            if (typeof file === 'object') {
                data = file.data;
            }

            if (!file?.mimetype && !options?.contentType) throw new Error('Specify the file content type.');

            let contentType = file?.mimetype ?? options?.contentType;

            if (options?.convertTo && contentType?.includes('image')) {
                if (this.file.getExtensionByMimeType(contentType) !== options.convertTo) {
                    data = await this.file.convertImage(options.convertTo, data);
                }

                contentType = this.file.getMimeTypeByExtension(options.convertTo);
            }

            const extension = this.file.getExtensionByMimeType(contentType);

            let fileName = `${options?.fileName ?? uuid()}.${extension}`;

            if (options?.preserveName && file?.name) {
                fileName = file.name.split('.');
                fileName.pop();
                fileName = `${fileName.join('.')}.${extension}`;
            }

            const key = `${path}/${fileName}`;

            const s3Response = await this.uploadS3MultiPart(data, {
                bucket: options?.s3?.bucket,
                key,
                contentType,
            });

            return {
                originalFilename: file?.name,
                fileName: fileName,
                path: key,
                s3: s3Response,
            };
        } catch (error) {
            this.logger.error('Failed to store file.');

            throw new Error('Failed to store file.', { cause: error });
        }
    }

    /**
     * Duplicate file from storage
     *
     * @param {string} name File name
     * @param {string} path Base path where to store file
     * @param {string} source Source file path
     * @param {object=} options
     */
    async duplicate(name, path, source, options = {}) {
        try {
            const extension = this.file.extractExtension(name);

            const fileName = `${uuid()}.${extension}`;

            const s3Response = await this.driver.send(
                new this.s3.CopyObjectCommand({
                    Bucket: options?.s3?.bucket,
                    Key: `${path}/${fileName}`,
                    CopySource: `${options?.s3?.bucket}/${source}`,
                    CacheControl: 'max-age=31536000',
                }),
            );

            return {
                originalFilename: name,
                fileName: fileName,
                path: `${path}/${fileName}`,
                s3: s3Response,
            };
        } catch (error) {
            this.logger.error('Failed to duplicate file.');

            throw new Error('Failed to duplicate file.', { cause: error });
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
     * Get file from storage
     * @param {string=} path Path to file
     * @param {object=} options
     * @param {string=} options.s3.bucket Bucket name
     *
     */
    async get(path, options = {}) {
        try {
            const file = await this.driver.send(
                new this.s3.GetObjectCommand({
                    Bucket: options?.s3?.bucket,
                    Key: path,
                }),
            );

            file.GetContent = async () => {
                const chunks = [];

                // eslint-disable-next-line no-restricted-syntax
                for await (const chunk of file.Body) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }

                return Buffer.concat(chunks);
            };

            return file;
        } catch (error) {
            this.logger.error('Failed to get files.');

            throw new Error('Failed to get files.', { cause: error });
        }
    }

    /**
     * List files from storage
     * @param {string=} directory Path to file
     * @param {object=} options
     * @param {string=} options.s3.bucket Bucket name
     *
     */
    async list(directory, options = {}) {
        try {
            const files = [];

            let nextToken;

            let isTruncated = true;

            while (isTruncated) {
                // eslint-disable-next-line no-await-in-loop
                const response = await this.driver.send(
                    new this.s3.ListObjectsV2Command({
                        Bucket: options?.s3?.bucket,
                        Prefix: directory ?? undefined,
                        ContinuationToken: nextToken,
                    }),
                );

                response.Contents.forEach((content) => {
                    files.push({
                        ...content,
                        GetContent: async () =>
                            (
                                await this.get(content.Key, {
                                    s3: { bucket: options?.s3?.bucket },
                                })
                            ).GetContent(),
                    });
                });

                nextToken = response?.NextContinuationToken;

                isTruncated = response.IsTruncated ?? false;
            }

            return files;
        } catch (error) {
            this.logger.error('Failed to list files.');

            throw new Error('Failed to list files.', { cause: error });
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
            this.logger.error('Failed to get signed url.');

            throw new Error('Failed to get signed url.', { cause: error });
        }
    }

    async convertImage(sourcePath, destinationPath, options = {}) {
        try {
            const sourceObject = await this.get(sourcePath, options);

            console.log('Starting conversion');
            const convertedImageBuffer = await this.file.convertImage('webp', await sourceObject.GetContent());

            if (options.backupPath) {
                console.log('Starting backup');
                await this.driver.send(
                    new this.s3.CopyObjectCommand({
                        Bucket: options?.s3?.bucket,
                        Key: options.backupPath,
                        CopySource: `${options?.s3?.bucket}/${sourcePath}`,
                        CacheControl: 'max-age=31536000',
                    }),
                );
            }

            console.log('Starting storing converted');
            await this.driver.send(
                new this.s3.PutObjectCommand({
                    Bucket: options?.s3?.bucket,
                    Key: destinationPath,
                    Body: convertedImageBuffer,
                    ContentType: 'image/webp',
                    CacheControl: 'max-age=31536000',
                }),
            );

            console.log('Starting deletion');
            await this.delete(sourcePath, options);
        } catch (error) {
            this.logger.error('Failed to convert image.');

            throw new Error('Failed to convert image.', { cause: error });
        }
    }
}
