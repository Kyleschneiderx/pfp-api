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
        };
    }
}
