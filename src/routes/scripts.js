import express from 'express';
import {
    EDUCATION_MEDIA_PATH,
    EDUCATION_PHOTO_PATH,
    EXERCISE_PHOTO_PATH,
    EXERCISE_VIDEO_PATH,
    PFPLAN_PHOTO_PATH,
    USER_PHOTO_PATH,
    WORKOUT_PHOTO_PATH,
} from '../constants/index.js';

export default ({ verifyAdmin, storage, database, file, helper }) => {
    const router = express.Router();

    router.use(verifyAdmin);

    router.get('/recompute-score', async (req, res) => {
        const [usersWithSurveys, surveyQuestionGroups, surveyQuestions, surveyQuestionAnswerScores] = await Promise.all([
            database.models.UserSurveyQuestionAnswers.findAll({ group: ['user_id'] }),
            database.models.SurveyQuestionGroups.findAll({
                include: { model: database.models.SurveyQuestionGroupIds, as: 'question_ids', separate: true },
            }),
            database.models.SurveyQuestions.findAll({
                include: [{ model: database.models.SurveyQuestionGroupIds, as: 'group_ids' }],
            }),
            database.models.SurveyQuestionAnswerScores.findAll({}),
        ]);

        const surveyQuestionGroupMap = {};

        let maxQuestionBinded = 0;

        const maxScore = 4;

        surveyQuestionGroups.forEach((item) => {
            surveyQuestionGroupMap[item.id] = item;

            if (item.question_ids.length > maxQuestionBinded) {
                maxQuestionBinded = item.question_ids.length;
            }
        });

        const surveyQuestionGroupIdsMap = {};

        surveyQuestions.forEach((item) => {
            surveyQuestionGroupIdsMap[item.id] = item.group_ids.map((groupId) => groupId.group_id);
        });

        const answerScoreMap = {};

        surveyQuestionAnswerScores.forEach((item) => {
            answerScoreMap[item.key] = item.score;
        });

        await Promise.all(
            usersWithSurveys.map(async (user) => {
                await database.models.UserSurveyQuestionAnswerScores.destroy({ force: true, where: { user_id: user.user_id } });

                const answers = await database.models.UserSurveyQuestionAnswers.findAll({
                    where: {
                        user_id: user.user_id,
                    },
                });

                const userAnswerByGroupScores = {};

                if (!answers) {
                    return false;
                }

                answers.forEach((answer) => {
                    const questionGroupIds = surveyQuestionGroupIdsMap[answer.question_id];

                    questionGroupIds.forEach((groupId) => {
                        if (userAnswerByGroupScores[groupId]) {
                            userAnswerByGroupScores[groupId].score += answer.score;
                        } else {
                            userAnswerByGroupScores[groupId] = {
                                user_id: answer.user_id,
                                question_group_id: groupId,
                                score: answer.score,
                                group_weight: surveyQuestionGroupMap[groupId].question_ids.length / maxQuestionBinded,
                                max_score: surveyQuestionGroupMap[groupId].question_ids.length * maxScore,
                                final_score: 0,
                                avg_score: 0,
                            };
                        }
                        userAnswerByGroupScores[groupId].avg_score =
                            userAnswerByGroupScores[groupId].score / userAnswerByGroupScores[groupId].max_score;
                        userAnswerByGroupScores[groupId].final_score =
                            userAnswerByGroupScores[groupId].avg_score * userAnswerByGroupScores[groupId].group_weight;
                    });
                });

                await database.models.UserSurveyQuestionAnswerScores.bulkCreate(
                    Object.keys(userAnswerByGroupScores).map((group) => ({
                        user_id: userAnswerByGroupScores[group].user_id,
                        question_group_id: userAnswerByGroupScores[group].question_group_id,
                        score: userAnswerByGroupScores[group].score,
                        max_score: userAnswerByGroupScores[group].max_score,
                        final_score: helper.toPercent(userAnswerByGroupScores[group].final_score),
                        avg_score: helper.toPercent(userAnswerByGroupScores[group].avg_score),
                        group_weight: helper.toPercent(userAnswerByGroupScores[group].group_weight),
                    })),
                );

                return true;
            }),
        );

        return res.json({ msg: 'Done' });
    });

    router.get('/convert/:resource', async (req, res) => {
        const { resource } = req.params;

        if (!resource) return res.json({ msg: 'Specify resource to convert.' });

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

        const [exercises, workouts, educations, pfPlans, users] = await Promise.all([
            database.models.Exercises.findAll({}),
            database.models.Workouts.findAll({}),
            database.models.Educations.findAll({}),
            database.models.PfPlans.findAll({}),
            database.models.UserProfiles.findAll({}),
        ]);

        const results = {
            exercises: [],
            workouts: [],
            educations: [],
            pfplans: [],
            users: [],
        };

        await Promise.all([
            ...(resource === 'exercises' && exercises
                ? exercises.map(async (each) => {
                      if (each.photo && each.photo.includes(EXERCISE_PHOTO_PATH)) {
                          const log = {
                              id: each.id,
                              old: {
                                  photo: each.photo,
                                  video: each.video,
                              },
                          };

                          try {
                              const photoUrl = parseFileUrl({ url: each.photo, prefix: EXERCISE_PHOTO_PATH });

                              const videoUrl = each.video ? parseFileUrl({ url: each.video, prefix: EXERCISE_VIDEO_PATH }) : undefined;

                              const newPhotoUrl = `${EXERCISE_PHOTO_PATH}/${photoUrl.rawFileName}.webp`;

                              const newVideoUrl = each.video ? `${EXERCISE_VIDEO_PATH}/${videoUrl?.fileName}` : undefined;

                              await storage.convertImage(photoUrl.parsedPath, newPhotoUrl, {
                                  s3: { bucket: process.env.S3_BUCKET_NAME },
                              });

                              each.photo = newPhotoUrl;

                              each.video = newVideoUrl;

                              await each.save();

                              log.new = {
                                  photo: newPhotoUrl,
                                  video: newVideoUrl,
                              };

                              return true;
                          } catch (error) {
                              log.error = error.message;

                              console.log(error);
                          } finally {
                              results.exercises.push(log);
                          }
                      }

                      return true;
                  })
                : []),
            ...(resource === 'workouts' && workouts
                ? workouts.map(async (each) => {
                      if (each.photo && each.photo.includes(WORKOUT_PHOTO_PATH)) {
                          const log = {
                              id: each.id,
                              old: {
                                  photo: each.photo,
                              },
                          };

                          try {
                              const photoUrl = parseFileUrl({ url: each.photo, prefix: WORKOUT_PHOTO_PATH });
                              const newPhotoUrl = `${WORKOUT_PHOTO_PATH}/${photoUrl.rawFileName}.webp`;

                              await storage.convertImage(photoUrl.parsedPath, newPhotoUrl, {
                                  s3: { bucket: process.env.S3_BUCKET_NAME },
                              });

                              each.photo = newPhotoUrl;

                              await each.save();

                              log.new = {
                                  photo: newPhotoUrl,
                              };

                              return true;
                          } catch (error) {
                              log.error = error.message;

                              console.log(error);
                          } finally {
                              results.workouts.push(log);
                          }
                      }

                      return true;
                  })
                : []),
            ...(resource === 'educations' && educations
                ? educations.map(async (each) => {
                      if (each.photo && each.photo.includes(EDUCATION_PHOTO_PATH)) {
                          const log = {
                              id: each.id,
                              old: {
                                  photo: each.photo,
                                  media: each.media_upload,
                              },
                          };

                          try {
                              const photoUrl = parseFileUrl({ url: each.photo, prefix: EDUCATION_PHOTO_PATH });

                              const mediaUrl = each.media_upload ? parseFileUrl({ url: each.media_upload, prefix: EDUCATION_MEDIA_PATH }) : undefined;

                              const newPhotoUrl = `${EDUCATION_PHOTO_PATH}/${photoUrl.rawFileName}.webp`;

                              const newMediaUrl = each.media_upload ? `${EDUCATION_MEDIA_PATH}/${mediaUrl?.fileName}` : undefined;

                              await storage.convertImage(photoUrl.parsedPath, newPhotoUrl, {
                                  s3: { bucket: process.env.S3_BUCKET_NAME },
                              });

                              each.photo = newPhotoUrl;

                              each.media_upload = newMediaUrl;

                              await each.save();

                              log.new = {
                                  photo: newPhotoUrl,
                                  media: newMediaUrl,
                              };

                              return true;
                          } catch (error) {
                              log.error = error.message;
                              console.log(error);
                          } finally {
                              results.educations.push(log);
                          }
                      }

                      return true;
                  })
                : []),
            ...(resource === 'pfplans' && pfPlans
                ? pfPlans.map(async (each) => {
                      if (each.photo && each.photo.includes(PFPLAN_PHOTO_PATH)) {
                          const log = {
                              id: each.id,
                              old: {
                                  photo: each.photo,
                              },
                          };

                          try {
                              const photoUrl = parseFileUrl({ url: each.photo, prefix: PFPLAN_PHOTO_PATH });
                              const newPhotoUrl = `${PFPLAN_PHOTO_PATH}/${photoUrl.rawFileName}.webp`;

                              await storage.convertImage(photoUrl.parsedPath, newPhotoUrl, {
                                  s3: { bucket: process.env.S3_BUCKET_NAME },
                              });

                              each.photo = newPhotoUrl;

                              await each.save();

                              log.new = {
                                  photo: newPhotoUrl,
                              };

                              return true;
                          } catch (error) {
                              log.error = error.message;
                              console.log(error);
                          } finally {
                              results.pfplans.push(log);
                          }
                      }

                      return false;
                  })
                : []),
            ...(resource === 'users' && users
                ? users.map(async (each) => {
                      if (each.photo && each.photo.includes(USER_PHOTO_PATH)) {
                          const log = {
                              id: each.id,
                              old: {
                                  photo: each.photo,
                              },
                          };

                          const photoUrl = parseFileUrl({ url: each.photo, prefix: USER_PHOTO_PATH });

                          try {
                              const newPhotoUrl = `${USER_PHOTO_PATH}/${photoUrl.rawFileName}.webp`;

                              await storage.convertImage(photoUrl.parsedPath, newPhotoUrl, {
                                  s3: { bucket: process.env.S3_BUCKET_NAME },
                              });

                              each.photo = newPhotoUrl;

                              await each.save();

                              log.new = {
                                  photo: newPhotoUrl,
                              };

                              return true;
                          } catch (error) {
                              log.error = error.message;
                              console.log(error);
                          } finally {
                              results.users.push(log);
                          }
                      }

                      return false;
                  })
                : []),
        ]);

        return res.json(results);
    });

    return router;
};
