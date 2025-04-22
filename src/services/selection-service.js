import { Sequelize } from 'sequelize';
import * as exceptions from '../exceptions/index.js';

export default class SelectionService {
    constructor({ logger, database }) {
        this.database = database;
        this.logger = logger;
    }

    /**
     * Get account types list
     * @param {object=} filter
     * @param {number=} filter.id Account type id
     * @returns {Promise<AccountTypes[]>} Account types model
     * @throws {InternalServerError} If failed to get account types
     */
    async getAccountTypes(filter) {
        try {
            return this.database.models.AccountTypes.findAll({
                nest: true,
                attributes: ['id', 'value'],
                order: [['value', 'ASC']],
                where: {
                    ...(filter?.id && { id: filter.id }),
                },
            });
        } catch (error) {
            this.logger.error('Failed to get account type list', error);

            throw new exceptions.InternalServerError('Failed to get account type list', error);
        }
    }

    /**
     * Get user types list
     * @param {object=} filter
     * @param {number=} filter.id User type id
     * @returns {Promise<UserTypes[]>} User types model
     * @throws {InternalServerError} If failed to get user types
     */
    async getUserTypes(filter) {
        try {
            return this.database.models.UserTypes.findAll({
                nest: true,
                attributes: ['id', 'value'],
                order: [['value', 'ASC']],
                where: {
                    ...(filter?.id && { id: filter.id }),
                },
            });
        } catch (error) {
            this.logger.error('Failed to get user type list', error);

            throw new exceptions.InternalServerError('Failed to get user type list', error);
        }
    }

    /**
     * Get status list
     * @param {object=} filter
     * @param {number=} filter.id Status id
     * @returns {Promise<Statuses[]>} Statuses model
     * @throws {InternalServerError} If failed to get status
     */
    async getStatuses(filter) {
        try {
            return this.database.models.Statuses.findAll({
                nest: true,
                attributes: ['id', 'value'],
                order: [['value', 'ASC']],
                where: {
                    ...(filter?.id && { id: filter.id }),
                },
            });
        } catch (error) {
            this.logger.error('Failed to get status list', error);

            throw new exceptions.InternalServerError('Failed to get status list', error);
        }
    }

    /**
     * Get exercise category list
     * @param {object=} filter
     * @param {number=} filter.id Excercise category id
     * @returns {Promise<ExerciseCategories[]>} Excercise category model
     * @throws {InternalServerError} If failed to get exercise category
     */
    async getExerciseCategories(filter) {
        try {
            return this.database.models.ExerciseCategories.findAll({
                nest: true,
                attributes: ['id', 'value'],
                order: [['value', 'ASC']],
                where: {
                    ...(filter?.id && { id: filter.id }),
                },
            });
        } catch (error) {
            this.logger.error('Failed to get exercise category list', error);

            throw new exceptions.InternalServerError('Failed to get exercise category list', error);
        }
    }

    /**
     * Get subscription package list
     * @param {object=} filter
     * @param {number=} filter.id Subscription package id
     * @returns {Promise<SubscriptionPackages[]>} Subscription package model
     * @throws {InternalServerError} If failed to get subscription package
     */
    async getSubscriptionPackages(filter) {
        try {
            const list = await this.database.models.SubscriptionPackages.findAll({
                nest: true,
                attributes: {
                    exclude: ['deleted_at'],
                },
                order: [['id', 'ASC']],
                where: {
                    ...(filter?.id && { id: filter.id }),
                },
            });

            return list.map((item) => {
                item.dataValues.price /= 100;

                if (item.dataValues.discounted_price) {
                    item.dataValues.discounted_price /= 100;
                }

                return item;
            });
        } catch (error) {
            this.logger.error('Failed to get subscription package list', error);

            throw new exceptions.InternalServerError('Failed to get subscription package list', error);
        }
    }

    /**
     * Get survey question groups list
     * @param {object=} filter
     * @param {number=} filter.id Group id
     * @returns {Promise<SurveyQuestionGroups[]>} SurveyQuestionGroups model
     * @throws {InternalServerError} If failed to get survey question group list
     */
    async getSurveyGroups(filter) {
        try {
            return await this.database.models.SurveyQuestionGroups.findAll({
                nest: true,
                attributes: ['id', 'description'],
                include: [
                    {
                        model: this.database.models.SurveyQuestions,
                        as: 'questions',
                        attributes: ['id', 'question'],
                        through: {
                            as: 'question_ids',
                            attributes: [],
                        },
                    },
                ],
                order: [['id', 'ASC']],
                where: {
                    ...(filter?.id && { id: filter.id }),
                },
            });
        } catch (error) {
            this.logger.error('Failed to get survey question group list', error);

            throw new exceptions.InternalServerError('Failed to get survey question group list', error);
        }
    }

    /**
     * Get overall selections
     * @param {object=} filter
     * @param {Array<string>=} filter.select Selections to return
     * @param {object=} filter.account_type Account type filter
     * @param {object=} filter.user_type User type filter
     * @param {object=} filter.status Status filter
     * @param {object=} filter.exercise_category Exercise category filter
     * @returns {Promise<{
     * account_type: AccountTypes[],
     * user_type: UserTypes[],
     * status: Statuses[],
     * exercise_category: ExerciseCategories[]
     * }>} Selection object
     * @throws {InternalServerError} If failed to get selections
     */
    async getSelections(filter) {
        if (filter.select !== undefined) {
            filter.select = filter.select.filter((item) => item !== '');
        }

        return {
            ...((filter.select?.includes('account_type') || filter.select?.length === 0 || filter.select === undefined) && {
                account_type: await this.getAccountTypes(filter?.account_type),
            }),
            ...((filter.select?.includes('user_type') || filter.select?.length === 0 || filter.select === undefined) && {
                user_type: await this.getUserTypes(filter?.user_type),
            }),
            ...((filter.select?.includes('status') || filter.select?.length === 0 || filter.select === undefined) && {
                status: await this.getStatuses(filter?.status),
            }),
            ...((filter.select?.includes('exercise_category') || filter.select?.length === 0 || filter.select === undefined) && {
                exercise_category: await this.getExerciseCategories(filter?.exercise_category),
            }),
            ...((filter.select?.includes('survey_group') || filter.select?.length === 0 || filter.select === undefined) && {
                survey_group: await this.getSurveyGroups(filter?.survey_group),
            }),
        };
    }

    /**
     * Check if user type exist
     * @param {number} typeId User type id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to verify user type
     */
    async isUserTypeExist(typeId) {
        try {
            return Boolean(await this.database.models.UserTypes.count({ where: { id: typeId } }));
        } catch (error) {
            this.logger.error('Failed to verify user type', error);

            throw new exceptions.InternalServerError('Failed to verify user type', error);
        }
    }

    /**
     * Create exercise category
     *
     * @param {object} data
     * @param {string} data.value Exercise category value
     * @returns {Promise<ExerciseCategories>}
     * @throws {InternalServerError} If failed to create exercise category
     */
    async createExerciseCategory(data) {
        try {
            return await this.database.models.ExerciseCategories.create(data);
        } catch (error) {
            this.logger.error('Failed to create exercise category', error);

            throw new exceptions.InternalServerError('Failed to create exercise category', error);
        }
    }

    /**
     * Update exercise category
     * @param {number} id Exercise category id
     * @param {object} data
     * @param {string} data.value Exercise category value
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to update exercise category
     */
    async updateExerciseCategory(id, data) {
        try {
            await this.database.models.ExerciseCategories.update(data, {
                where: { id: id },
            });

            return await this.database.models.ExerciseCategories.findOne({
                attributes: {
                    exclude: ['deleted_at'],
                },
                where: { id: id },
            });
        } catch (error) {
            this.logger.error('Failed to update exercise category', error);

            throw new exceptions.InternalServerError('Failed to update exercise category', error);
        }
    }

    /**
     * Remove exercise category
     *
     * @param {number} id Exercise category id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to remove exercise category
     */
    async removeExerciseCategory(id) {
        try {
            return await this.database.models.ExerciseCategories.destroy({
                where: { id },
            });
        } catch (error) {
            this.logger.error('Failed to remove exercise category', error);

            throw new exceptions.InternalServerError('Failed to remove exercise category', error);
        }
    }

    /**
     * Check if exercise category exist using id
     * @param {number} id Exercise category id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to verify exercise category
     */
    async isExerciseCategoryExistById(id) {
        try {
            return Boolean(await this.database.models.ExerciseCategories.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error('Failed to verify exercise category', error);

            throw new exceptions.InternalServerError('Failed to verify exercise category', error);
        }
    }

    /**
     * Check if exercise category exist using name
     * @param {string} name Exercise category name
     * @param {number=} id Exercise category id to exclude
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to verify exercise category
     */
    async isExerciseCategoryExistByValue(name, id = undefined) {
        try {
            return Boolean(
                await this.database.models.ExerciseCategories.count({ where: { value: name, ...(id && { id: { [Sequelize.Op.ne]: id } }) } }),
            );
        } catch (error) {
            this.logger.error('Failed to verify exercise category', error);

            throw new exceptions.InternalServerError('Failed to verify exercise category', error);
        }
    }

    /**
     * Check if status exist using id
     *
     * @param {number} id Status id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to verify status
     */
    async isStatusExistById(id) {
        try {
            return Boolean(await this.database.models.Statuses.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error('Failed to verify status', error);

            throw new exceptions.InternalServerError('Failed to verify status', error);
        }
    }

    /**
     * Get subscription package by id
     *
     * @param {number} id Subscription package id
     * @returns {Promise<SubscriptionPackages>}
     * @throws {InternalServerError} If failed to get subscription package
     */
    async getSubscriptionPackageById(id) {
        try {
            return await this.database.models.SubscriptionPackages.findOne({
                attributes: {
                    exclude: ['deleted_at'],
                },
                where: { id: id },
            });
        } catch (error) {
            this.logger.error('Failed to get subscription package', error);

            throw new exceptions.InternalServerError('Failed to get subscription package', error);
        }
    }

    /**
     * Check if content category exist using id
     * @param {number} id Content category id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to verify content category
     */
    async isContentCategoryExistById(id) {
        try {
            return Boolean(await this.database.models.SurveyQuestionGroups.count({ where: { id: id } }));
        } catch (error) {
            this.logger.error('Failed to verify content category', error);

            throw new exceptions.InternalServerError('Failed to verify content category', error);
        }
    }

    /**
     * Check if content category exist using description
     * @param {number} id Content category description
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to verify content category
     */
    async isContentCategoryExistByDescription(description, id) {
        try {
            return Boolean(
                await this.database.models.SurveyQuestionGroups.count({
                    where: { description: description, ...(id && { id: { [Sequelize.Op.ne]: id } }) },
                }),
            );
        } catch (error) {
            this.logger.error('Failed to verify content category', error);

            throw new exceptions.InternalServerError('Failed to verify content category', error);
        }
    }

    /**
     * Create content category
     *
     * @param {object} data
     * @param {string} data.description Content category value
     * @param {object} data.questionId Survey question ids
     * @returns {Promise<SurveyQuestionGroups>}
     * @throws {InternalServerError} If failed to create content category
     */
    async createContentCategory(data) {
        try {
            const surveyGroup = await this.database.models.SurveyQuestionGroups.create(
                {
                    description: data.description,
                    question_ids: data.questionId.map((id) => ({
                        question_id: id,
                    })),
                },
                {
                    include: [
                        {
                            model: this.database.models.SurveyQuestionGroupIds,
                            as: 'question_ids',
                        },
                    ],
                },
            );

            delete surveyGroup.dataValues.question_ids;

            return surveyGroup;
        } catch (error) {
            this.logger.error('Failed to create content category', error);

            throw new exceptions.InternalServerError('Failed to create content category', error);
        }
    }

    /**
     * Update content category
     * @param {number} id Content category id
     * @param {object} data
     * @param {string} data.description Content category value
     * @param {object} data.questionId Survey question ids
     * @returns {Promise<SurveyQuestionGroups>}
     * @throws {InternalServerError} If failed to update content category
     */
    async updateContentCategory(id, data) {
        try {
            await this.database.models.SurveyQuestionGroups.update(
                { description: data.description },
                {
                    where: { id: id },
                },
            );

            await this.database.models.SurveyQuestionGroupIds.destroy({
                where: { group_id: id },
                force: true,
            });

            await this.database.models.SurveyQuestionGroupIds.bulkCreate(
                data.questionId.map((questionId) => ({
                    group_id: id,
                    question_id: questionId,
                })),
            );

            return await this.database.models.SurveyQuestionGroups.findOne({
                attributes: {
                    exclude: ['deleted_at', 'value'],
                },
                where: { id: id },
            });
        } catch (error) {
            this.logger.error('Failed to update content category', error);

            throw new exceptions.InternalServerError('Failed to update content category', error);
        }
    }

    /**
     * Remove content category
     *
     * @param {number} id Content category id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to remove content category
     */
    async removeContentCategory(id) {
        try {
            return this.database.transaction(async (transaction) => {
                await this.database.models.SurveyQuestionGroupIds.destroy({
                    where: { group_id: id },
                    transaction: transaction,
                });

                return this.database.models.SurveyQuestionGroups.destroy({
                    where: { id },
                    transaction: transaction,
                });
            });
        } catch (error) {
            this.logger.error('Failed to remove content category', error);

            throw new exceptions.InternalServerError('Failed to remove content category', error);
        }
    }
}
