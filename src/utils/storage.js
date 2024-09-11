import { v4 as uuid } from 'uuid';

export default class Storage {
    constructor({ logger, driver, file, s3 = undefined }) {
        this.driver = driver;
        this.logger = logger;
        this.s3 = s3;
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
        try {
            const fileName = `${uuid()}.${this.file.extractExtension(name)}`;

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
            this.logger.error('Failed to store file.');

            throw new Error('Failed to store file.', { cause: error });
        }
    }

    /**
     * Remove file from storage
     *
     * @param {string} path Path to file
     * @param {object=} options
     */
    async delete(path, options = {}) {
        try {
            let bucketUrl;
            if (path.includes('amazonaws.com/')) {
                bucketUrl = path.split('amazonaws.com/');
            }

            return await this.driver.send(
                new this.s3.DeleteObjectCommand({
                    Bucket: options?.s3?.bucket,
                    Key: bucketUrl[1] ?? path,
                }),
            );
        } catch (error) {
            this.logger.error('Failed to delete file.');

            throw new Error('Failed to delete file.', { cause: error });
        }
    }
}
