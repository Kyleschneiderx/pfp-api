import { Sequelize } from 'sequelize';
import { EXERCISE_AUDIO_PATH, EXERCISE_VIDEO_PATH, EXERCISE_PHOTO_PATH, ASSET_URL } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class ExerciseService {
    constructor({ logger, database, storage }) {
        this.database = database;
        this.logger = logger;
        this.storage = storage;
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
        const s3UploadResponse = await Promise.allSettled([
            this.storage.store(data.photo.name, data.photo.data, EXERCISE_PHOTO_PATH, {
                contentType: data.photo.mimetype,
                s3: { bucket: process.env.S3_BUCKET_NAME },
            }),
            this.storage.store(data.video.name, data.video.data, EXERCISE_VIDEO_PATH, {
                contentType: data.video.mimetype,
                s3: { bucket: process.env.S3_BUCKET_NAME },
            }),
            this.storage.store(data.audio.name, data.audio.data, EXERCISE_AUDIO_PATH, {
                contentType: data.audio.mimetype,
                s3: { bucket: process.env.S3_BUCKET_NAME },
            }),
        ]);

        let s3UploadRejected;

        const [photoStoreResponse, videoStoreResponse, audioStoreResponse] = s3UploadResponse.map((response) => {
            if (response.status === 'rejected') s3UploadRejected = response;

            return response?.value ?? undefined;
        });

        const successUploadPaths = [photoStoreResponse?.path ?? [], videoStoreResponse?.path ?? [], audioStoreResponse?.path ?? []].flat();

        if (s3UploadRejected) {
            this.logger.error('Failed to process files', s3UploadRejected.reason);

            await this.storage.delete(successUploadPaths, {
                s3: { bucket: process.env.S3_BUCKET_NAME },
            });

            throw new exceptions.InternalServerError('Failed to process files', s3UploadRejected.reason);
        }

        try {
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
            await this.storage.delete(successUploadPaths, {
                s3: { bucket: process.env.S3_BUCKET_NAME },
            });

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
            if (filter.sort.length === 1 && !Array.isArray(filter.sort[0])) {
                options.order = [['id', ...filter.sort]];
            } else {
                filter.sort = filter.sort.map((sort) => {
                    if (sort[0] === 'name') {
                        sort[0] = this.database.col(`user_profile.${sort[0]}`);
                    }
                    sort[1] = sort[1].toUpperCase();
                    return sort;
                });
                options.order = filter.sort;
            }
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
}
