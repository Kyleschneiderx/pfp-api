import { Sequelize } from 'sequelize';
import {
    EDUCATION_MEDIA_PATH,
    EDUCATION_PHOTO_PATH,
    EXERCISE_PHOTO_PATH,
    EXERCISE_VIDEO_PATH,
    PFPLAN_PHOTO_PATH,
    USER_PHOTO_PATH,
    WORKOUT_PHOTO_PATH,
} from '../constants/index.js';

export default ({ logger, database, file, storage }) => {
    const name = 'Image Optimization';

    return {
        name: name,
        schedule: '*/1 * * * *',
        process: async () => {
            logger.info(`Starting task [${name}]`);
            try {
                const [exercise, workout, education, pfPlan, user] = await Promise.all([
                    database.models.Exercises.findOne({
                        where: {
                            id: {
                                [Sequelize.Op.notIn]: Sequelize.literal(
                                    `(${database.dialect.queryGenerator
                                        .selectQuery('image_optimization_logs', {
                                            attributes: ['resource_id'],
                                            where: {
                                                resource: 'exercises',
                                            },
                                        })
                                        .slice(0, -1)})`,
                                ),
                            },
                        },
                    }),
                    database.models.Workouts.findOne({
                        where: {
                            id: {
                                [Sequelize.Op.notIn]: Sequelize.literal(
                                    `(${database.dialect.queryGenerator
                                        .selectQuery('image_optimization_logs', {
                                            attributes: ['resource_id'],
                                            where: {
                                                resource: 'workouts',
                                            },
                                        })
                                        .slice(0, -1)})`,
                                ),
                            },
                        },
                    }),
                    database.models.Educations.findOne({
                        where: {
                            id: {
                                [Sequelize.Op.notIn]: Sequelize.literal(
                                    `(${database.dialect.queryGenerator
                                        .selectQuery('image_optimization_logs', {
                                            attributes: ['resource_id'],
                                            where: {
                                                resource: 'educations',
                                            },
                                        })
                                        .slice(0, -1)})`,
                                ),
                            },
                        },
                    }),
                    database.models.PfPlans.findOne({
                        where: {
                            id: {
                                [Sequelize.Op.notIn]: Sequelize.literal(
                                    `(${database.dialect.queryGenerator
                                        .selectQuery('image_optimization_logs', {
                                            attributes: ['resource_id'],
                                            where: {
                                                resource: 'pf_plans',
                                            },
                                        })
                                        .slice(0, -1)})`,
                                ),
                            },
                        },
                    }),
                    database.models.UserProfiles.findOne({
                        where: {
                            id: {
                                [Sequelize.Op.notIn]: Sequelize.literal(
                                    `(${database.dialect.queryGenerator
                                        .selectQuery('image_optimization_logs', {
                                            attributes: ['resource_id'],
                                            where: {
                                                resource: 'user_profiles',
                                            },
                                        })
                                        .slice(0, -1)})`,
                                ),
                            },
                        },
                    }),
                ]);

                const parseFileUrl = ({ url, prefix }) => {
                    if (!url) return {};

                    const fileName = url.split(`${prefix}/`)[1];

                    const extension = file.extractExtension(fileName);

                    const rawFileName = fileName.replace(`.${extension}`, '');

                    const parsedPath = `${prefix}/${fileName}`;

                    return {
                        fileName,
                        extension,
                        rawFileName,
                        parsedPath,
                    };
                };

                const isOptimizable = async (resource) => {
                    try {
                        const isUrl = new URL(resource.photo);

                        return true;
                    } catch (error) {
                        /** empty */

                        return false;
                    }
                };

                const logOptimize = async (data) => {
                    await database.models.ImageOptimizationLogs.create(data);
                };

                const optimize = async (resource, resourceType) => {
                    const log = {
                        id: resource.id,
                        old: {
                            photo: resource.photo,
                            video: resource?.video,
                            media: resource?.media_upload,
                        },
                    };

                    let resourcePath = '';
                    let resourceVideoPath = '';
                    let resourceMediaPath = '';
                    if (resourceType === 'exercises') {
                        resourcePath = EXERCISE_PHOTO_PATH;
                        resourceVideoPath = EXERCISE_VIDEO_PATH;
                    } else if (resourceType === 'workouts') {
                        resourcePath = WORKOUT_PHOTO_PATH;
                    } else if (resourceType === 'educations') {
                        resourcePath = EDUCATION_PHOTO_PATH;
                        resourceMediaPath = EDUCATION_MEDIA_PATH;
                    } else if (resourceType === 'pf_plans') {
                        resourcePath = PFPLAN_PHOTO_PATH;
                    } else if (resourceType === 'user_profiles') {
                        resourcePath = USER_PHOTO_PATH;
                    }

                    try {
                        const photoUrl = parseFileUrl({ url: resource.photo, prefix: resourcePath });

                        const videoUrl = resource?.video ? parseFileUrl({ url: resource.video, prefix: resourceVideoPath }) : undefined;

                        const mediaUrl = resource?.media_upload ? parseFileUrl({ url: resource.media_upload, prefix: resourceMediaPath }) : undefined;

                        const newPhotoUrl = `${resourcePath}/${photoUrl.rawFileName}.webp`;

                        const newVideoUrl = resource?.video ? `${resourceVideoPath}/${videoUrl?.fileName}` : undefined;

                        const newMediaUrl = resource?.media_upload ? `${resourceMediaPath}/${mediaUrl?.fileName}` : undefined;

                        await storage.convertImage(photoUrl.parsedPath, newPhotoUrl, {
                            backupPath: `${resourcePath}-backup/${photoUrl.fileName}`,
                            s3: { bucket: process.env.S3_BUCKET_NAME },
                        });

                        resource.photo = newPhotoUrl;

                        if (resource?.video) {
                            resource.video = newVideoUrl;
                        }

                        if (resource?.media_upload) {
                            resource.media_upload = newMediaUrl;
                        }

                        await resource.save();

                        log.new = {
                            photo: newPhotoUrl,
                            video: newVideoUrl,
                            media: resource?.media_upload,
                        };
                    } catch (error) {
                        console.log(error);
                        log.error = error.message;
                    } finally {
                        await logOptimize({
                            resource: resourceType,
                            resource_id: resource.id,
                            log: JSON.stringify(log),
                            error: log.error,
                        });
                    }
                };

                if (exercise) {
                    console.log('Starting execise image optimization');
                    if (await isOptimizable(exercise)) {
                        await optimize(exercise, 'exercises');
                    } else {
                        await logOptimize({
                            resource: 'exercises',
                            resource_id: exercise.id,
                            log: JSON.stringify({}),
                            error: 'not optimizable',
                        });
                    }
                }

                if (workout) {
                    console.log('Starting workout image optimization');
                    if (await isOptimizable(workout)) {
                        await optimize(workout, 'workouts');
                    } else {
                        await logOptimize({
                            resource: 'workouts',
                            resource_id: workout.id,
                            log: JSON.stringify({}),
                            error: 'not optimizable',
                        });
                    }
                }

                if (pfPlan) {
                    console.log('Starting pf plan image optimization');
                    if (await isOptimizable(pfPlan)) {
                        await optimize(pfPlan, 'pf_plans');
                    } else {
                        await logOptimize({
                            resource: 'pf_plans',
                            resource_id: pfPlan.id,
                            log: JSON.stringify({}),
                            error: 'not optimizable',
                        });
                    }
                }

                if (education) {
                    console.log('Starting education image optimization');
                    if (await isOptimizable(education)) {
                        await optimize(education, 'educations');
                    } else {
                        await logOptimize({
                            resource: 'educations',
                            resource_id: education.id,
                            log: JSON.stringify({}),
                            error: 'not optimizable',
                        });
                    }
                }

                if (user) {
                    console.log('Starting user image optimization');
                    if (await isOptimizable(user)) {
                        await optimize(user, 'user_profiles');
                    } else {
                        await logOptimize({
                            resource: 'user_profiles',
                            resource_id: user.id,
                            log: JSON.stringify({}),
                            error: 'not optimizable',
                        });
                    }
                }
            } catch (error) {
                logger.error(`[${name}] task failed`, error);
            }
        },
    };
};
