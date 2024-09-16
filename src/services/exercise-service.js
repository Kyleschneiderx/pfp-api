import { Sequelize } from 'sequelize';
import { EXERCISE_AUDIO_PATH, EXERCISE_VIDEO_PATH, EXERCISE_PHOTO_PATH, ASSET_URL, S3_OBJECT_URL } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class ExerciseService {
    constructor({ logger, database, storage, helper }) {
        this.database = database;
        this.logger = logger;
        this.storage = storage;
        this.helper = helper;
    }

    /**
     * Upload files to s3 bucket
     *
     * @param {object} files
     * @param {object} files.photo Photo file
     * @param {object} files.video Video file
     * @param {object} files.audio Audio file
     * @returns {Promise<{
     * photo: { originalFilename: string, fileName: string, path: string, s3: object } | undefined,
     * video: { originalFilename: string, fileName: string, path: string, s3: object } | undefined,
     * audio: { originalFilename: string, fileName: string, path: string, s3: object } | undefined,
     * uploadedFilePaths: string[]
     * }>}
     */
    async _uploadFilesToS3(files) {
        try {
            const storeResponse = await Promise.allSettled([
                ...((files.photo && [
                    this.storage.store(files.photo.name, files.photo.data, EXERCISE_PHOTO_PATH, {
                        contentType: files.photo.mimetype,
                        s3: { bucket: process.env.S3_BUCKET_NAME },
                    }),
                ]) ??
                    []),
                ...((files.video && [
                    this.storage.store(files.video.name, files.video.data, EXERCISE_VIDEO_PATH, {
                        contentType: files.video.mimetype,
                        s3: { bucket: process.env.S3_BUCKET_NAME },
                    }),
                ]) ??
                    []),
                ...((files.audio && [
                    this.storage.store(files.audio.name, files.audio.data, EXERCISE_AUDIO_PATH, {
                        contentType: files.audio.mimetype,
                        s3: { bucket: process.env.S3_BUCKET_NAME },
                    }),
                ]) ??
                    []),
            ]);

            let rejectedStore;

            const [photoStoreResponse, videoStoreResponse, audioStoreResponse] = storeResponse.map((response) => {
                if (response.status === 'rejected') rejectedStore = response;

                return response?.value ?? undefined;
            });

            const uploadedPaths = [photoStoreResponse?.path ?? [], videoStoreResponse?.path ?? [], audioStoreResponse?.path ?? []].flat();

            if (rejectedStore) {
                this.logger.error('Failed to upload files on s3', rejectedStore.reason);

                await this.storage.delete(uploadedPaths, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });

                throw new exceptions.InternalServerError('Failed to upload files on s3', rejectedStore.reason);
            }

            return {
                photo: photoStoreResponse,
                video: videoStoreResponse,
                audio: audioStoreResponse,
                uploadedFilePaths: uploadedPaths,
            };
        } catch (error) {
            throw new exceptions.InternalServerError('Failed to process files', error);
        }
    }

    /**
     * Create exercise
     * @param {object} data
     * @param {string} data.name Exercise name
     * @param {number} data.categoryId Exercise category
     * @param {number} data.sets Exercise number of sets
     * @param {number} data.reps Exercise number of reps
     * @param {number} data.hold Exercise hold time
     * @param {string} data.description Exercise description
     * @param {string} data.howTo Exercise how to
     * @param {object} data.photo Exercise photo
     * @param {object} data.video Exercise video
     * @param {object} data.audio Exercise audio
     * @returns {Promise<Exercises>} Exercises model instance
     * @throws {InternalServerError} If failed to create exercise
     */
    async createExercise(data) {
        let s3UploadResponse;

        try {
            s3UploadResponse = await this._uploadFilesToS3({
                photo: data.photo,
                video: data.video,
                audio: data.audio,
            });

            const { photo: photoStoreResponse, video: videoStoreResponse, audio: audioStoreResponse } = s3UploadResponse;

            return await this.database.models.Exercises.create({
                name: data.name,
                category_id: data.categoryId,
                sets: data.sets,
                reps: data.reps,
                hold: data.hold,
                description: data.description,
                how_to: data.howTo,
                photo: photoStoreResponse?.path ? `${ASSET_URL}/${photoStoreResponse?.path}` : null,
                video: videoStoreResponse?.path ? `${ASSET_URL}/${videoStoreResponse?.path}` : null,
                audio: audioStoreResponse?.path ? `${ASSET_URL}/${audioStoreResponse?.path}` : null,
            });
        } catch (error) {
            if (s3UploadResponse?.uploadedFilePaths) {
                await this.storage.delete(s3UploadResponse.uploadedFilePaths, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            this.logger.error('Failed to create exercise.', error);

            throw new exceptions.InternalServerError('Failed to create exercise', error);
        }
    }

    /**
     * Retrieve user account information
     * @param {object} filter
     * @param {number=} filter.id Exercise id
     * @param {string=} filter.name Exercise name
     * @param {(number|number[])=} filter.categoryId Exercise category id
     * @param {number=} filter.setsFrom Exercise sets start
     * @param {number=} filter.setsTo Exercise sets end
     * @param {number=} filter.repsFrom Exercise sets start
     * @param {number=} filter.repsTo Exercise sets end
     * @param {Array=} filter.sort Field and order to be use for sorting
     * @example [ [ {field}:{order} ] ]
     * @param {number=} filter.page Page for list to navigate
     * @param {number=} filter.pageItems Number of items return per page
     * @returns {Promise<{
     * data: Exercises[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Exercises instance and pagination details
     * @throws {InternalServerError} If failed to get user
     * @throws {NotFoundError} If no records found
     */
    async getExercises(filter) {
        const options = {
            nest: true,
            subQuery: false,
            limit: filter.pageItems,
            offset: filter.page * filter.pageItems - filter.pageItems,
            attributes: {
                exclude: ['deleted_at', 'category_id'],
            },
            include: [
                {
                    model: this.database.models.ExerciseCategories,
                    as: 'exercise_category',
                    attributes: ['id', 'value'],
                    where: {},
                },
            ],
            order: [['id', 'DESC']],
            where: {
                ...(filter.id && { id: filter.id }),
                ...(filter.categoryId && { category_id: filter.categoryId }),
                ...(filter.setsFrom && {
                    sets: { [Sequelize.Op.gte]: filter.setsFrom, ...(filter.setsTo && { [Sequelize.Op.lte]: filter.setsTo }) },
                }),
                ...(filter.repsFrom && {
                    sets: { [Sequelize.Op.gte]: filter.repsFrom, ...(filter.repsTo && { [Sequelize.Op.lte]: filter.repsTo }) },
                }),
                ...(filter.name && { name: { [Sequelize.Op.like]: `%${filter.name}%` } }),
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
            ({ count, rows } = await this.database.models.Exercises.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get exercises', error);
        }

        if (!rows.length) throw new exceptions.NotFound('No records found.');

        return {
            data: rows,
            page: filter.page,
            page_items: filter.pageItems,
            max_page: Math.ceil(count / filter.pageItems),
        };
    }

    /**
     * Remove exercise
     *
     * @param {number} id Exercise id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to remove exercise
     */
    async removeExercise(id) {
        try {
            const exercise = await this.database.models.Exercises.findOne({ where: { id: id } });

            const toRemoveFiles = [
                ...(exercise.photo && [exercise.photo.replace(ASSET_URL, S3_OBJECT_URL)]),
                ...(exercise.video && [exercise.video.replace(ASSET_URL, S3_OBJECT_URL)]),
                ...(exercise.audio && [exercise.audio.replace(ASSET_URL, S3_OBJECT_URL)]),
            ];

            await this.storage.delete(toRemoveFiles, {
                s3: { bucket: process.env.S3_BUCKET_NAME },
            });

            return await this.database.models.Exercises.destroy({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to remove exercise', error);
        }
    }

    /**
     * Update exercise
     * @param {object} data
     * @param {number} data.id Exercise id
     * @param {string=} data.name Exercise name
     * @param {number=} data.categoryId Exercise category
     * @param {number=} data.sets Exercise number of sets
     * @param {number=} data.reps Exercise number of reps
     * @param {number=} data.hold Exercise hold time
     * @param {string=} data.description Exercise description
     * @param {string=} data.howTo Exercise how to
     * @param {object=} data.photo Exercise photo
     * @param {object=} data.video Exercise video
     * @param {object=} data.audio Exercise audio
     * @returns {Promise<Exercises>} Exercises model instance
     * @throws {InternalServerError} If failed to update exercise
     */
    async updateExercise(data) {
        let s3UploadResponse;
        try {
            const exercise = await this.database.models.Exercises.findOne({ where: { id: data.id } });

            s3UploadResponse = await this._uploadFilesToS3({
                photo: data.photo,
                video: data.video,
                audio: data.audio,
            });

            const { photo: photoStoreResponse, video: videoStoreResponse, audio: audioStoreResponse } = s3UploadResponse;

            const toRemoveFiles = [];

            if (photoStoreResponse) toRemoveFiles.push(exercise.photo.replace(ASSET_URL, S3_OBJECT_URL));

            if (videoStoreResponse) toRemoveFiles.push(exercise.video.replace(ASSET_URL, S3_OBJECT_URL));

            if (audioStoreResponse) toRemoveFiles.push(exercise.audio.replace(ASSET_URL, S3_OBJECT_URL));

            exercise.name = data.name;
            exercise.category_id = data.categoryId;
            exercise.sets = data.sets;
            exercise.reps = data.reps;
            exercise.hold = data.hold;
            exercise.description = data.description;
            exercise.how_to = data.howTo;
            exercise.photo = photoStoreResponse?.path ? `${ASSET_URL}/${photoStoreResponse?.path}` : undefined;
            exercise.video = videoStoreResponse?.path ? `${ASSET_URL}/${videoStoreResponse?.path}` : undefined;
            exercise.audio = audioStoreResponse?.path ? `${ASSET_URL}/${audioStoreResponse?.path}` : undefined;

            await exercise.save();

            await exercise.reload();

            if (toRemoveFiles.length !== 0) {
                await this.storage.delete(toRemoveFiles, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            delete exercise.dataValues.deleted_at;

            return exercise;
        } catch (error) {
            if (s3UploadResponse?.uploadedFilePaths !== undefined) {
                await this.storage.delete(s3UploadResponse.uploadedFilePaths, {
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            }

            this.logger.error('Failed to update exercise.', error);

            throw new exceptions.InternalServerError('Failed to update exercise', error);
        }
    }

    /**
     * Check if exercise exist using id
     *
     * @param {number} id Exercise id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check exercise by id
     */
    async isExerciseExistById(id) {
        try {
            return Boolean(await this.database.models.Exercises.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check exercise', error);
        }
    }
}
