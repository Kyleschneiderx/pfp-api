import { Sequelize } from 'sequelize';
import {
    ADMIN_ACCOUNT_TYPE_ID,
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    ASSET_URL,
    S3_OBJECT_URL,
    EDUCATION_PHOTO_PATH,
    EDUCATION_MEDIA_PATH,
    PUBLISHED_EDUCATION_STATUS_ID,
    FAVORITE_EDUCATION_STATUS,
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
                ]) ?? [undefined]),
                ...((files.media && [
                    this.storage.store(files.media.name, files.media.data, EDUCATION_MEDIA_PATH, {
                        contentType: files.media.mimetype,
                        s3: { bucket: process.env.S3_BUCKET_NAME },
                    }),
                ]) ?? [undefined]),
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
     * @param {string} data.description Education description
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
                description: data.description,
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
     * Update education
     * @param {object} data
     * @param {number} data.id Education id
     * @param {string=} data.title Education title
     * @param {string=} data.description Education description
     * @param {string=} data.content Education content
     * @param {object=} data.photo Education photo
     * @param {number=} data.statusId Education status id
     * @param {object=} data.mediaUrl Education media URL. Video/Image
     * @param {object=} data.mediaUpload Education media upload. Video/Image
     * @returns {Promise<Educations>} Educations model instance
     * @throws {InternalServerError} If failed to update education
     */
    async updateEducation(data) {
        let s3UploadResponse;
        try {
            const education = await this.database.models.Educations.findOne({ where: { id: data.id } });

            s3UploadResponse = await this._uploadFilesToS3({
                photo: data.photo,
                media: data.mediaUpload,
            });

            const { photo: photoStoreResponse, media: mediaStoreResponse } = s3UploadResponse;

            const toRemoveFiles = [];

            if (photoStoreResponse && education.photo) toRemoveFiles.push(education.photo.replace(ASSET_URL, S3_OBJECT_URL));

            if (mediaStoreResponse && education.media_upload) toRemoveFiles.push(education.media_upload.replace(ASSET_URL, S3_OBJECT_URL));

            education.title = data.title;

            education.description = data.description;

            education.content = data.content;

            education.photo = photoStoreResponse?.path ? `${ASSET_URL}/${photoStoreResponse?.path}` : undefined;

            education.media_url = data.mediaUrl;

            education.media_upload = mediaStoreResponse?.path ? `${ASSET_URL}/${mediaStoreResponse?.path}` : undefined;

            education.status_id = data.statusId;

            await education.save();

            await education.reload();

            education.photo = this.helper.generateProtectedUrl(education.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            education.media_upload = this.helper.generateProtectedUrl(
                education.media_upload,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

            if (toRemoveFiles.length !== 0) {
                await this.storage.delete(toRemoveFiles, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            delete education.dataValues.deleted_at;

            return education;
        } catch (error) {
            if (s3UploadResponse?.uploadedFilePaths !== undefined) {
                await this.storage.delete(s3UploadResponse.uploadedFilePaths, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            this.logger.error('Failed to update education.', error);

            throw new exceptions.InternalServerError('Failed to update education', error);
        }
    }

    /**
     * Get list of educations
     *
     * @param {object} filter
     * @param {string=} filter.id Education id
     * @param {string=} filter.title Education title
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
                ...(filter.title && { title: { [Sequelize.Op.like]: `%${filter.title}%` } }),
                ...(filter.statusId && { status_id: filter.statusId }),
            },
        };

        if (filter.sort !== undefined) {
            options.order = this.helper.parseSortList(
                filter.sort,
                {
                    id: undefined,
                    title: undefined,
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
     * Get education details
     *
     * @param {number} id Education id
     * @param {object} filter
     * @param {number=} filter.statusId Education status id
     * @param {number=} filter.authenticatedUser Authenticated user
     * @returns {Promise<Educations>} Educations model instance
     * @throws {InternalServerError} If failed to get educations
     */
    async getEducationDetails(id, filter) {
        try {
            const education = await this.database.models.Educations.findOne({
                nest: true,
                subQuery: false,
                attributes: [
                    'id',
                    'title',
                    'description',
                    'content',
                    'photo',
                    'media_url',
                    'media_upload',
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [[Sequelize.fn('COALESCE', Sequelize.col('is_favorite'), null, 0), 'is_favorite']]
                        : []),
                    'created_at',
                    'updated_at',
                ],
                include: [
                    {
                        model: this.database.models.Statuses,
                        as: 'status',
                        attributes: ['id', 'value'],
                        where: {},
                    },
                    ...(filter?.authenticatedUser?.account_type_id !== ADMIN_ACCOUNT_TYPE_ID
                        ? [
                              {
                                  model: this.database.models.UserFavoriteEducations,
                                  as: 'user_favorite_educations',
                                  attributes: [],
                                  required: false,
                                  where: {
                                      user_id: filter.authenticatedUser.user_id,
                                  },
                              },
                          ]
                        : []),
                ],
                order: [['id', 'DESC']],
                where: {
                    id: id,
                    ...(filter.statusId && { status_id: filter.statusId }),
                },
            });

            education.photo = this.helper.generateProtectedUrl(education.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
            });

            education.media_upload = this.helper.generateProtectedUrl(
                education.media_upload,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

            if (education.dataValues.is_favorite) {
                education.dataValues.is_favorite = Boolean(education.dataValues.is_favorite);
            }

            return education;
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get education details', error);
        }
    }

    /**
     * Remove education
     *
     * @param {number} id Education id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to remove education
     */
    async removeEducation(id) {
        try {
            const education = await this.database.models.Educations.findOne({ where: { id: id } });

            if (education.photo) {
                await this.storage.delete(education.photo.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            if (education.media_upload) {
                await this.storage.delete(education.media_upload.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            return await education.destroy();
        } catch (error) {
            this.logger.error('Failed to remove education', error);

            throw new exceptions.InternalServerError('Failed to remove education', error);
        }
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

    /**
     * Check if published education exist using id
     *
     * @param {number} id Education id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check education by id
     */
    async isPublishedEducationExistById(id) {
        try {
            return Boolean(await this.database.models.Educations.count({ where: { id: id, status_id: PUBLISHED_EDUCATION_STATUS_ID } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check published education', error);
        }
    }

    /**
     * Update user education favorite status
     *
     * @param {number} userId User account id
     * @param {number} educationId Education id
     * @param {boolean} favoriteStatus Education favorite status
     * @throws {InternalServerError} If failed to update favorite educations
     * @returns {Promise<UserFavoriteEducations>} UserFavoriteEducations instance
     */
    async updateUserFavoriteEducations(userId, educationId, favoriteStatus) {
        try {
            const [userEducationFavorite, createdUserEducationFavorite] = await this.database.models.UserFavoriteEducations.findOrCreate({
                where: {
                    user_id: userId,
                    education_id: educationId,
                },
                defaults: {
                    user_id: userId,
                    education_id: educationId,
                    is_favorite: favoriteStatus,
                },
            });

            if (userEducationFavorite) {
                userEducationFavorite.is_favorite = favoriteStatus;

                await userEducationFavorite.save();
            }

            return userEducationFavorite ?? createdUserEducationFavorite;
        } catch (error) {
            this.logger.error('Failed to update favorite educations.', error);

            throw new exceptions.InternalServerError('Failed to update favorite educations.', error);
        }
    }

    /**
     * Get favorite educations for user
     *
     * @param {object} filter
     * @param {number} filter.userId User account user id
     * @param {string=} filter.id Education id
     * @param {string=} filter.title Education title
     * @param {number} filter.page Page number
     * @param {number} filter.pageItems Items per page
     * @returns {Promise<{
     * data: Educations[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Educations instance and pagination details
     * @throws {InternalServerError} If failed to get favorite educations
     * @throws {NotFoundError} If no records found
     */
    async getFavoriteEducations(filter) {
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
                {
                    model: this.database.models.UserFavoriteEducations,
                    as: 'user_favorite_educations',
                    required: true,
                    attributes: [],
                    where: {
                        user_id: filter.userId,
                        is_favorite: true,
                    },
                },
            ],
            order: [['id', 'DESC']],
            where: {
                ...(filter.id && { id: filter.id }),
                ...(filter.title && { title: { [Sequelize.Op.like]: `%${filter.title}%` } }),
            },
        };

        let count;
        let rows;
        try {
            ({ count, rows } = await this.database.models.Educations.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get favorite educations', error);
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
     * Check if favorite education exist using id
     *
     * @param {number} id Education id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check favorite education by id
     */
    async isFavoriteEducationExistById(id, userId) {
        try {
            return Boolean(
                await this.database.models.UserFavoriteEducations.count({
                    where: { education_id: id, is_favorite: FAVORITE_EDUCATION_STATUS, user_id: userId },
                }),
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check favorite education', error);
        }
    }

    /**
     * Check if education exist using title
     *
     * @param {string} title Education title
     * @param {number=} id Education id to be exempt
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check education by title
     */
    async isEducationTitleExist(title, id) {
        try {
            return Boolean(await this.database.models.Educations.count({ where: { title: title, ...(id && { id: { [Sequelize.Op.ne]: id } }) } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check education', error);
        }
    }
}
