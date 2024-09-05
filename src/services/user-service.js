import { Sequelize } from 'sequelize';
import { USER_ACCOUNT_TYPE_ID, ACTIVE_STATUS_ID, ADMIN_ACCOUNT_TYPE_ID } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class UserService {
    constructor({ logger, database, password }) {
        this.database = database;
        this.logger = logger;
        this.password = password;
    }

    /**
     * Retrieve user account information
     * @param {object} filter
     * @param {string=} filter.email User account email address
     * @param {number=} filter.userId User account id
     * @param {string=} filter.googleId User account google id
     * @param {string=} filter.appleId User account apple id
     * @param {number=} filter.accountTypeId User account's account type id
     * @returns {Promise<Users>} Users model
     * @throws {InternalServerError} If failed to get user
     */
    async getUser(filter) {
        try {
            return await this.database.models.Users.findOne({
                attributes: {
                    exclude: ['deleted_at'],
                },
                where: {
                    ...(filter.email && { email: filter.email }),
                    ...(filter.userId && { id: filter.userId }),
                    ...(filter.googleId && { google_id: filter.googleId }),
                    ...(filter.appleId && { apple_id: filter.appleId }),
                    ...(filter.accountTypeId && { account_type_id: filter.accountTypeId }),
                },
            });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get user', error);
        }
    }

    /**
     * Retrieve user account information
     * @param {object} filter
     * @param {string=} filter.email User account email address
     * @param {number=} filter.userId User account id
     * @param {string=} filter.name User account name
     * @param {Array=} filter.sort Field and order to be use for sorting
     * @example [ [ {field}:{order} ] ]
     * @param {number=} filter.page Page for list to navigate
     * @param {number=} filter.pageItems Number of items return per page
     * @returns {Promise<{
     * data: Users[],
     * page: number,
     * page_items: number,
     * max_page: number
     * }>} Users model and pagination details
     * @throws {InternalServerError} If failed to get user
     * @throws {NotFoundError} If no records found
     */
    async getUsers(filter) {
        const options = {
            nest: true,
            subQuery: false,
            limit: filter.pageItems,
            offset: filter.page * filter.pageItems - filter.pageItems,
            attributes: ['id', 'email', 'last_login_at', 'verified_at', 'created_at', 'updated_at'],
            include: [
                {
                    model: this.database.models.UserProfiles,
                    as: 'user_profile',
                    attributes: ['name', 'birthdate', 'contact_number', 'description', 'photo'],
                    where: {},
                },
                {
                    model: this.database.models.AccountTypes,
                    as: 'account_type',
                    attributes: ['id', 'value'],
                    where: {},
                },
                {
                    model: this.database.models.UserTypes,
                    as: 'user_type',
                    attributes: ['id', 'value'],
                    where: {},
                },
                {
                    model: this.database.models.Statuses,
                    as: 'status',
                    attributes: ['id', 'value'],
                    where: {},
                },
            ],
            order: [['id', 'DESC']],
            where: {
                account_type_id: USER_ACCOUNT_TYPE_ID,
                ...(filter.userId && { id: filter.userId }),
                ...(filter.email && { email: { [Sequelize.Op.like]: `%${filter.email}%` } }),
                ...(filter.name && { '$user_profile.name$': { [Sequelize.Op.like]: `%${filter.name}%` } }),
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
            ({ count, rows } = await this.database.models.Users.findAndCountAll(options));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get users', error);
        }

        if (!rows.length) throw new exceptions.NotFound('No records found.');

        return {
            data: rows,
            page: filter.page,
            page_items: filter.page_items,
            max_page: Math.ceil(count / filter.page_items),
        };
    }

    /**
     * Update user last login time
     * @param {number} userId User account id
     * @returns {Promise<void>}
     * @throws {InternalServerError} If failed to update user last login time
     */
    async updateUserLastLogin(userId) {
        try {
            return await this.database.models.Users.update(
                {
                    last_login_at: new Date(),
                    updated_at: new Date(),
                },
                { where: { id: userId } },
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to update user last login', error);
        }
    }

    /**
     * Update user verified time
     * @param {number} userId User account id
     * @returns {Promise<void>}
     * @throws {InternalServerError} If failed to update user confirmation time
     */
    async updateUserVerifiedTime(email) {
        try {
            return await this.database.models.Users.update(
                {
                    verified_at: new Date(),
                    updated_at: new Date(),
                },
                { where: { email: email } },
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to update user confirmation time', error);
        }
    }

    /**
     * Create user account
     * @param {object} data
     * @param {string} data.email User account email address
     * @param {string} data.password User account password
     * @param {string} data.name User account full name
     * @param {string} data.birthdate User account birthdate
     * @param {string} data.contactNumber User account contact number
     * @param {string=} data.description User account description
     * @param {number} data.type_id User account user type id
     * @param {object=} data.photo User account photo
     * @returns {Promise<Users>} Users model instance
     * @throws {InternalServerError} If failed to create user account
     */
    async createUserAccount(data) {
        const uploadedPhoto = null;
        try {
            const userInfo = await this.database.transaction(async (transaction) => {
                const user = await this.database.models.Users.create(
                    {
                        email: data.email,
                        password: data.password ? this.password.generate(data.password) : null,
                        type_id: data.type_id ?? ADMIN_ACCOUNT_TYPE_ID,
                        account_type_id: USER_ACCOUNT_TYPE_ID,
                        status_id: ACTIVE_STATUS_ID,
                    },
                    {
                        transaction: transaction,
                    },
                );

                const profile = await this.database.models.UserProfiles.create(
                    {
                        user_id: user.id,
                        name: data.name,
                        contact_number: data.contactNumber,
                        birthdate: data.birthdate,
                        description: data.description,
                        photo: uploadedPhoto,
                    },
                    { transaction: transaction },
                );

                delete user.dataValues.password;
                delete profile.dataValues.id;
                delete profile.dataValues.user_id;
                delete profile.dataValues.created_at;
                delete profile.dataValues.updated_at;

                user.dataValues.user_profile = profile;

                return user;
            });

            return userInfo;
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to create user account', error);
        }
    }

    /**
     * Check if email already exist
     * @param {string} email User account email address
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check email
     */
    async isEmailExist(email) {
        try {
            return Boolean(await this.database.models.Users.count({ where: { email: email } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check email', error);
        }
    }

    /**
     * Check if email already exist using user id
     * @param {string} email User account email address
     * @param {number} userId User account user id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check email
     */
    async isEmailExistByUserId(email, userId) {
        try {
            return Boolean(await this.database.models.Users.count({ where: { email: email, id: { [Sequelize.Op.ne]: userId } } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check email', error);
        }
    }

    /**
     * Check if user exist using user id
     * @param {number} userId User account user id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check user by user id
     */
    async isUserExistByUserId(userId) {
        try {
            return Boolean(await this.database.models.Users.count({ where: { id: userId } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check user', error);
        }
    }

    /**
     * Update user account
     * @param {object} data
     * @param {number} data.userId User account id
     * @param {string=} data.email User account email address
     * @param {string=} data.name User account full name
     * @param {string=} data.birthdate User account birthdate
     * @param {string=} data.description User account description
     * @param {number=} data.type_id User account user type id
     * @param {object=} data.photo User account photo
     * @returns {Promise<Users>} Users model instance
     * @throws {InternalServerError} If failed to update user
     * @throws {InternalServerError} If failed to update profile
     */
    async updateUserAccount(data) {
        const uploadedPhoto = null;

        let user;
        try {
            user = await this.database.models.Users.findOne({
                attributes: { exclude: ['deleted_at', 'password', 'google_id', 'apple_id'] },
                where: { id: data.userId },
            });

            user.email = data.email ?? user.email;

            user.type_id = data.type_id ?? user.type_id;

            if (user.changed()) {
                await user.save();
            }
        } catch (error) {
            this.logger.error('Failed to update user', error);

            throw new exceptions.InternalServerError('Failed to update user', error);
        }

        let profile;
        try {
            profile = await this.database.models.UserProfiles.findOne({
                attributes: { exclude: ['deleted_at', 'user_id', 'created_at', 'updated_at'] },
                where: { user_id: data.userId },
            });

            profile.name = data.name ?? profile.name;

            profile.contact_number = data.contact_number ?? profile.contact_number;

            profile.description = data.description ?? profile.description;

            profile.birthdate = data.birthdate ?? profile.birthdate;

            profile.photo = uploadedPhoto ?? profile.photo;

            if (profile.changed()) {
                await profile.save();
            }

            delete profile.dataValues.id;
        } catch (error) {
            this.logger.error('Failed to update user', error);
        }

        user.dataValues.user_profile = profile;

        return user;
    }

    /**
     * Remove user account
     * @param {number} userId User account user id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to remove user account
     */
    async removeUserAccount(userId) {
        try {
            return await this.database.models.Users.destroy({
                where: {
                    id: userId,
                },
            });
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to remove user account', error);
        }
    }

    /**
     * Remove user account photo
     * @param {number} userId User account user id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to remove user account photo
     */
    async removeUserPhoto(userId) {
        try {
            return await this.database.models.UserProfiles.update(
                { photo: null },
                {
                    where: {
                        user_id: userId,
                    },
                },
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to remove user account photo', error);
        }
    }
}
