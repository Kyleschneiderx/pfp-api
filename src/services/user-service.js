import { Sequelize } from 'sequelize';
import {
    USER_ACCOUNT_TYPE_ID,
    INACTIVE_STATUS_ID,
    ADMIN_ACCOUNT_TYPE_ID,
    USER_PHOTO_PATH,
    USER_PHOTO_HEIGHT,
    USER_PHOTO_WIDTH,
    ASSET_URL,
    S3_OBJECT_URL,
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class UserService {
    constructor({ logger, database, password, storage, file, helper }) {
        this.database = database;
        this.logger = logger;
        this.password = password;
        this.storage = storage;
        this.file = file;
        this.helper = helper;
    }

    /**
     * Retrieve user account information
     * @param {object} filter
     * @param {string=} filter.email User account email address
     * @param {number=} filter.userId User account id
     * @param {string=} filter.googleId User account google id
     * @param {string=} filter.appleId User account apple id
     * @param {number=} filter.accountTypeId User account's account type id
     * @param {boolean=} filter.withProfile To include user profile
     * @returns {Promise<Users>} Users model
     * @throws {InternalServerError} If failed to get user
     */
    async getUser(filter) {
        try {
            const user = await this.database.models.Users.findOne({
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
                include: [
                    ...((filter.withProfile && [
                        {
                            model: this.database.models.UserProfiles,
                            as: 'user_profile',
                            attributes: ['name', 'birthdate', 'contact_number', 'description', 'photo'],
                            where: {},
                        },
                    ]) ??
                        []),
                ],
            });

            if (user.user_profile) {
                user.user_profile.photo = this.helper.generateProtectedUrl(
                    user.user_profile.photo,
                    `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                    {
                        expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                    },
                );
            }

            return user;
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
     * @param {number[]} filter.statusId User account status id
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
                ...(filter.statusId && { status_id: filter.statusId }),
                ...(filter.email && { email: { [Sequelize.Op.like]: `%${filter.email}%` } }),
                ...(filter.name && { '$user_profile.name$': { [Sequelize.Op.like]: `%${filter.name}%` } }),
            },
        };

        if (filter.sort !== undefined) {
            options.order = this.helper.parseSortList(
                filter.sort,
                {
                    id: undefined,
                    name: 'user_profile',
                    last_login_at: undefined,
                },
                this.database,
            );
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

        rows = rows.map((row) => {
            row.user_profile.photo = this.helper.generateProtectedUrl(
                row.user_profile.photo,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

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
                    status_id: ACTIVE_STATUS_ID,
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
     * @param {number} data.typeId User account user type id
     * @param {object=} data.photo User account photo
     * @param {string=} data.googleId User account google id
     * @param {string=} data.appleId User account apple id
     * @param {number} data.statusId User account status id
     * @param {Date=} data.verified_at User account verified date
     * @returns {Promise<Users>} Users model instance
     * @throws {InternalServerError} If failed to process photo
     * @throws {InternalServerError} If failed to create user account
     */
    async createUserAccount(data) {
        let storeResponse;

        if (data.photo !== undefined) {
            try {
                const resizeData = await this.file.resizeImage(data.photo.data, USER_PHOTO_WIDTH, USER_PHOTO_HEIGHT);

                storeResponse = await this.storage.store(data.photo.name, resizeData, USER_PHOTO_PATH, {
                    contentType: data.photo.mimetype,
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            } catch (error) {
                this.logger.error(error.message, error);

                throw new exceptions.InternalServerError('Failed to process photo', error);
            }
        }

        try {
            const userInfo = await this.database.transaction(async (transaction) => {
                const user = await this.database.models.Users.create(
                    {
                        email: data.email,
                        password: data.password ? this.password.generate(data.password) : null,
                        type_id: data.typeId ?? ADMIN_ACCOUNT_TYPE_ID,
                        google_id: data.googleId ?? null,
                        apple_id: data.appleId ?? null,
                        account_type_id: USER_ACCOUNT_TYPE_ID,
                        status_id: data.statusId ?? INACTIVE_STATUS_ID,
                        verified_at: data.verified_at ?? null,
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
                        photo: storeResponse?.path ? `${ASSET_URL}/${storeResponse?.path}` : null,
                    },
                    { transaction: transaction },
                );

                profile.photo = this.helper.generateProtectedUrl(profile.photo, `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`, {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                });

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
            if (storeResponse !== undefined) {
                await this.storage.delete(storeResponse?.path, { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

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
     * @param {string=} data.contactNumber User account contact number
     * @param {string=} data.description User account description
     * @param {number=} data.typeId User account user type id
     * @param {object=} data.photo User account photo
     * @returns {Promise<Users>} Users model instance
     * @throws {InternalServerError} If failed to process photo
     * @throws {InternalServerError} If failed to update user
     * @throws {InternalServerError} If failed to update profile
     */
    async updateUserAccount(data) {
        let storeResponse;

        if (data.photo !== undefined) {
            try {
                const resizeData = await this.file.resizeImage(data.photo.data, USER_PHOTO_WIDTH, USER_PHOTO_HEIGHT);

                storeResponse = await this.storage.store(data.photo.name, resizeData, USER_PHOTO_PATH, {
                    contentType: data.photo.mimetype,
                    s3: { bucket: process.env.S3_BUCKET_NAME },
                });
            } catch (error) {
                this.logger.error(error.message, error);

                throw new exceptions.InternalServerError('Failed to process photo', error);
            }
        }

        try {
            const usersUpdatePayload = {
                ...(data.email && { email: data.email }),
                ...(data.typeId && { type_id: data.typeId }),
            };

            const userProfilesUpdatePayload = {
                ...(data.name && { name: data.name }),
                ...(data.contactNumber && { contact_number: data.contactNumber }),
                ...(data.birthdate && { birthdate: data.birthdate }),
                ...(data.description && { description: data.description }),
                ...(storeResponse?.path && { photo: `${ASSET_URL}/${storeResponse?.path}` }),
            };

            const user = await this.getUser({ userId: data.userId, withProfile: true });

            await this.database.transaction(async (transaction) => {
                await this.database.models.Users.update(
                    usersUpdatePayload,
                    {
                        where: { id: data.userId },
                    },
                    {
                        transaction: transaction,
                    },
                );

                await this.database.models.UserProfiles.update(
                    userProfilesUpdatePayload,
                    { where: { user_id: data.userId } },
                    { transaction: transaction },
                );
            });

            if (storeResponse?.path && user.user_profile.photo) {
                await this.storage.delete(user.user_profile.photo.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            await user.reload();
            await user.user_profile.reload();

            user.user_profile.photo = this.helper.generateProtectedUrl(
                user.user_profile.photo,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

            delete user.dataValues.password;
            delete user.dataValues.google_id;
            delete user.dataValues.apple_id;
            delete user.dataValues.deleted_at;
            delete user.user_profile.dataValues.id;
            delete user.user_profile.dataValues.user_id;
            delete user.user_profile.dataValues.created_at;
            delete user.user_profile.dataValues.updated_at;
            delete user.user_profile.dataValues.deleted_at;

            return user;
        } catch (error) {
            if (storeResponse !== undefined) {
                await this.storage.delete(storeResponse?.path, { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            this.logger.error('Failed to update user', error);

            throw new exceptions.InternalServerError('Failed to update user', error);
        }
    }

    /**
     * Remove user account
     * @param {number} userId User account user id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to remove user account
     */
    async removeUserAccount(userId) {
        try {
            const user = await this.getUser({ userId: userId, withProfile: true });

            if (user.user_profile.photo) {
                await this.storage.delete(user.user_profile.photo.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

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

    /**
     * Reset user password
     * @param {number} userId User account user id
     * @param {string} password User account new password
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to reset user password
     */
    async resetUserPassword(userId, password) {
        try {
            return await this.database.models.Users.update(
                { password: this.password.generate(password) },
                {
                    where: {
                        id: userId,
                    },
                },
            );
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to reset user password', error);
        }
    }
}
