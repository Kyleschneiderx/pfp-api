import { Sequelize } from 'sequelize';
import {
    ADMIN_ACCOUNT_TYPE_ID,
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    ASSET_URL,
    S3_OBJECT_URL,
    EDUCATION_PHOTO_PATH,
    EDUCATION_MEDIA_PATH,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class EducationService {
    constructor({ logger, database, helper, storage }) {
        this.database = database;
        this.logger = logger;
        this.helper = helper;
        this.storage = storage;
    }

    /**
     * Upload files to s3 bucket
     *
     * @param {object} files
     * @param {object} files.photo Photo file
     * @param {object} files.media Video/Image file
     * @returns {Promise<{
     * photo: { originalFilename: string, fileName: string, path: string, s3: object } | undefined,
     * media: { originalFilename: string, fileName: string, path: string, s3: object } | undefined,
     * uploadedFilePaths: string[]
     * }>}
     */
    async _uploadFilesToS3(files) {
        try {
            const storeResponse = await Promise.allSettled([
                ...((files.photo && [
                    this.storage.store(files.photo.name, files.photo.data, EDUCATION_PHOTO_PATH, {
                        contentType: files.photo.mimetype,
                        s3: { bucket: process.env.S3_BUCKET_NAME },
                    }),
                ]) ??
                    []),
                ...((files.media && [
                    this.storage.store(files.media.name, files.media.data, EDUCATION_MEDIA_PATH, {
                        contentType: files.media.mimetype,
                        s3: { bucket: process.env.S3_BUCKET_NAME },
                    }),
                ]) ??
                    []),
            ]);

            let rejectedStore;

            const [photoStoreResponse, mediaStoreResponse] = storeResponse.map((response) => {
                if (response.status === 'rejected') rejectedStore = response;

                return response?.value ?? undefined;
            });

            const uploadedPaths = [photoStoreResponse?.path ?? [], mediaStoreResponse?.path ?? []].flat();

            if (rejectedStore) {
                this.logger.error('Failed to upload files on s3', rejectedStore.reason);

                await this.storage.delete(uploadedPaths, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });

                throw new exceptions.InternalServerError('Failed to upload files on s3', rejectedStore.reason);
            }

            return {
                photo: photoStoreResponse,
                media: mediaStoreResponse,
                uploadedFilePaths: uploadedPaths,
            };
        } catch (error) {
            throw new exceptions.InternalServerError('Failed to process files', error);
        }
    }

    /**
     * Create education
     * @param {object} data
     * @param {string} data.title Education title
     * @param {string} data.content Education content
     * @param {number} data.statusId Education status id
     * @param {object} data.photo Education photo
     * @param {object} data.mediaUrl Education media URL. Video/Image
     * @param {object} data.mediaUpload Education media upload. Video/Image
     * @returns {Promise<Educations>} Educations model instance
     * @throws {InternalServerError} If failed to create education
     */
    async createEducation(data) {
        let s3UploadResponse;

        try {
            s3UploadResponse = await this._uploadFilesToS3({
                photo: data.photo,
                media: data.mediaUpload,
            });

            const { photo: photoStoreResponse, media: mediaStoreResponse } = s3UploadResponse;

            const education = await this.database.models.Educations.create({
                title: data.title,
                content: data.content,
                media_url: data.mediaUrl,
                media_upload: mediaStoreResponse?.path ? `${ASSET_URL}/${mediaStoreResponse?.path}` : null,
                photo: photoStoreResponse?.path ? `${ASSET_URL}/${photoStoreResponse?.path}` : null,
                status_id: data.statusId,
            });

            education.media_upload = this.helper.generateProtectedUrl(
                education.media_upload,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

            education.photo = this.helper.generateProtectedUrl(education.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            return education;
        } catch (error) {
            if (s3UploadResponse?.uploadedFilePaths) {
                await this.storage.delete(s3UploadResponse.uploadedFilePaths, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            this.logger.error('Failed to create education.', error);

            throw new exceptions.InternalServerError('Failed to create education', error);
        }
    }

    /**
     * Get list of educations
     *
     * @param {object} filter
     * @param {string=} filter.id Education id
     * @param {string=} filter.name Education name
     * @param {string=} filter.statusId Education status id
     * @param {Array=} filter.sort Field and order to be use for sorting
     * @example [ [ {field}:{order} ] ]
     * @param {number=} filter.page Page for list to navigate
     * @param {number=} filter.pageItems Number of items return per page
     * @returns {Promise<{
     * data: Educations[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Educations isntance and pagination details
     * @throws {InternalServerError} If failed to get educations
     * @throws {NotFoundError} If no records found
     */
    async getEducations(filter) {
        const options = {
            nest: true,
            subQuery: false,
            limit: filter.pageItems,
            offset: filter.page * filter.pageItems - filter.pageItems,
            attributes: {
                exclude: ['deleted_at', 'status_id'],
            },
            include: [
                {
                    model: this.database.models.Statuses,
                    as: 'status',
                    attributes: ['id', 'value'],
                    where: {},
                },
            ],
            order: [['id', 'DESC']],
            where: {
                ...(filter.id && { id: filter.id }),
                ...(filter.name && { name: { [Sequelize.Op.like]: `%${filter.name}%` } }),
                ...(filter.statusId && { status_id: { [Sequelize.Op.like]: `%${filter.statusId}%` } }),
            },
        };

        if (filter.sort !== undefined) {
            options.order = this.helper.parseSortList(
                filter.sort,
                {
                    id: undefined,
                    name: undefined,
                },
                this.database,
            );
        }

        let count;
        let rows;
        try {
            ({ count, rows } = await this.database.models.Educations.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get educations', error);
        }

        if (!rows.length) throw new exceptions.NotFound('No records found.');

        rows = rows.map((row) => {
            row.photo = this.helper.generateProtectedUrl(row.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            row.media_upload = this.helper.generateProtectedUrl(row.media_upload, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            return row;
        });

        return {
            data: rows,
            page: filter.page,
            page_items: filter.pageItems,
            max_page: Math.ceil(count / filter.pageItems),
        };
    }

    /**
     * Check if education exist using id
     *
     * @param {number} id Education id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check education by id
     */
    async isEducationExistById(id) {
        try {
            return Boolean(await this.database.models.Educations.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check education', error);
        }
    }
}
