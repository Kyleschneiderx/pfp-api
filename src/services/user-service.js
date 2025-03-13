import { Sequelize } from 'sequelize';
import * as dateFns from 'date-fns';
import * as dateFnsUtc from '@date-fns/utc';
import {
    USER_ACCOUNT_TYPE_ID,
    ACTIVE_STATUS_ID,
    INACTIVE_STATUS_ID,
    ADMIN_ACCOUNT_TYPE_ID,
    USER_PHOTO_PATH,
    USER_PHOTO_HEIGHT,
    USER_PHOTO_WIDTH,
    ASSET_URL,
    S3_OBJECT_URL,
    ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
    FREE_USER_TYPE_ID,
    PREMIUM_USER_TYPE_ID,
    NOTIFICATIONS,
    INACTIVE_ACCOUNT_PERIOD_IN_DAYS,
    DATE_FORMAT,
    WEEKLY_PERIOD,
    WEEKLY_PERIOD_UNIT,
    MONTHLY_PERIOD_UNIT,
    MONTHLY_PERIOD_LABEL_FORMAT,
    WEEKLY_PERIOD_LABEL_FORMAT,
    EXPIRED_PURCHASE_STATUS,
    CANCELLED_PURCHASE_STATUS,
    SUBSCRIPTION_PRODUCTS,
    CONVERSION_API_EVENTS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class UserService {
    constructor({ logger, database, password, storage, file, helper, notificationService, facebookPixel }) {
        this.database = database;
        this.logger = logger;
        this.password = password;
        this.storage = storage;
        this.file = file;
        this.helper = helper;
        this.notificationService = notificationService;
        this.facebookPixel = facebookPixel;
    }

    /**
     * Default users relation
     * @returns {object[]}
     */
    _defaultUsersRelation() {
        return [
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
        ];
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

            if (user?.user_profile) {
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
            attributes: ['id', 'password', 'email', 'last_login_at', 'verified_at', 'created_at', 'updated_at', 'google_id', 'apple_id'],
            include: [...this._defaultUsersRelation()],
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
            const hasLastLoginSort = filter.sort.find((field) => field[0] === 'last_login_at');

            const hasIdSort = filter.sort.find((field) => field[0] === 'id');

            if (hasLastLoginSort !== undefined && hasIdSort === undefined) {
                filter.sort.push(['id', hasLastLoginSort[1]]);
            }

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
            row.dataValues.can_invite = false;
            if (row.dataValues.google_id === null && row.dataValues.apple_id === null) {
                row.dataValues.can_invite = !row.dataValues.password;
            }

            row.user_profile.photo = this.helper.generateProtectedUrl(
                row.user_profile.photo,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

            delete row.dataValues.password;

            delete row.dataValues.google_id;

            delete row.dataValues.apple_id;

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
     * Retrieve user account information
     *
     * @param {number} userId User account id
     * @returns {Promise<Users>} Users instance
     * @throws {InternalServerError} If failed to get user
     */
    async getUserDetails(id) {
        try {
            const user = await this.database.models.Users.findOne({
                nest: true,
                subQuery: false,
                attributes: ['id', 'email', 'last_login_at', 'verified_at', 'created_at', 'updated_at'],
                include: [...this._defaultUsersRelation()],
                order: [['id', 'DESC']],
                where: {
                    id: id,
                },
            });

            user.dataValues.has_answered_survey = await this.hasUserAnsweredSurvey(user.id);

            user.user_profile.photo = this.helper.generateProtectedUrl(
                user.user_profile.photo,
                `${process.env.S3_REGION}|${process.env.S3_BUCKET_NAME}`,
                {
                    expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES,
                },
            );

            user.dataValues.user_subscription = await this.database.models.UserSubscriptions.findOne({
                attributes: ['package_id', 'expires_at'],
                where: {
                    user_id: id,
                    status: {
                        [Sequelize.Op.notIn]: [EXPIRED_PURCHASE_STATUS, CANCELLED_PURCHASE_STATUS],
                    },
                },
                order: [['id', 'DESC']],
            });

            if (user.dataValues.user_subscription !== null) {
                user.dataValues.user_subscription.dataValues.package_id =
                    SUBSCRIPTION_PRODUCTS[user.dataValues.user_subscription.dataValues.package_id];
            }

            return user;
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get users', error);
        }
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
    async updateUserVerifiedTime(userId) {
        try {
            return await this.database.models.Users.update(
                {
                    verified_at: new Date(),
                    updated_at: new Date(),
                },
                { where: { id: userId } },
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
        try {
            const resizeData = await this.file.resizeImage(data.photo?.data, USER_PHOTO_WIDTH, USER_PHOTO_HEIGHT);

            storeResponse = await this.storage.store(data.photo?.name, resizeData, USER_PHOTO_PATH, {
                contentType: data.photo?.mimetype,
                s3: { bucket: process.env.S3_BUCKET_NAME },
            });

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

            try {
                this.facebookPixel.createEvent(CONVERSION_API_EVENTS.SIGNUP, {
                    event_id: crypto.SHA256(`${userInfo.id}|${CONVERSION_API_EVENTS.SIGNUP}|`).toString(),
                    user_data: {
                        em: crypto.SHA256(userInfo.user_profile.email).toString(),
                    },
                });
            } catch (error) {
                this.logger.error('Failed to send event to conversion api.', error);
            }

            await this.notificationService.removeUserNotifications(userInfo.id);

            this.notificationService.createNotification({ userId: userInfo.id, descriptionId: NOTIFICATIONS.WELCOME });

            return userInfo;
        } catch (error) {
            await this.storage.delete(storeResponse?.path, { s3: { bucket: process.env.S3_BUCKET_NAME } });

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
     * Check if user is premium
     *
     * @param {number} id User account id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to check premium user
     */
    async isUserPremium(id) {
        try {
            return Boolean(await this.database.models.Users.count({ where: { id: id, type_id: PREMIUM_USER_TYPE_ID } }));
        } catch (error) {
            this.logger.error('Failed to check premium user', error);

            throw new exceptions.InternalServerError('Failed to check premium user', error);
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
     * Check if user exist using name
     *
     * @param {string} name User name
     * @param {number=} id User id to be exempt
     * @returns {boolean}
     * @throws {InternalServerError} If failed to check user by name
     */
    async isUserNameExist(name, id) {
        try {
            return Boolean(
                await this.database.models.UserProfiles.count({ where: { name: name, ...(id && { user_id: { [Sequelize.Op.ne]: id } }) } }),
            );
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
        try {
            const resizeData = await this.file.resizeImage(data.photo?.data, USER_PHOTO_WIDTH, USER_PHOTO_HEIGHT);

            storeResponse = await this.storage.store(data.photo?.name, resizeData, USER_PHOTO_PATH, {
                contentType: data.photo?.mimetype,
                s3: { bucket: process.env.S3_BUCKET_NAME },
            });

            const usersUpdatePayload = {
                ...(data.email && { email: data.email }),
                ...(data.typeId && { type_id: data.typeId }),
            };

            const userProfilesUpdatePayload = {
                ...(data.name && { name: data.name }),
                ...(data.contactNumber !== undefined && { contact_number: data.contactNumber }),
                ...(data.birthdate !== undefined && { birthdate: data.birthdate }),
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
            await this.storage.delete(storeResponse?.path, { s3: { bucket: process.env.S3_BUCKET_NAME } });

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
     * Remove user account using the app
     * @param {number} userId User account user id
     * @returns {boolean}
     * @throws {InternalServerError} If failed to remove user account
     */
    async removeUserAccountViaApp(userId) {
        try {
            const user = await this.getUser({ userId: userId, withProfile: true });

            if (user.user_profile.photo) {
                await this.storage.delete(user.user_profile.photo.replace(ASSET_URL, S3_OBJECT_URL), { s3: { bucket: process.env.S3_BUCKET_NAME } });
            }

            return await Promise.all([
                this.database.models.UserProfiles.update(
                    {
                        name: `deleted_user_${new Date().getTime()}`,
                        contact_number: null,
                        birthdate: null,
                        description: null,
                        photo: null,
                        deleted_at: new dateFnsUtc.UTCDate(),
                    },
                    {
                        where: {
                            user_id: userId,
                        },
                    },
                ),
                this.database.models.Users.update(
                    {
                        email: `deleted_user_${new Date().getTime()}`,
                        google_id: null,
                        apple_id: null,
                        deleted_at: new dateFnsUtc.UTCDate(),
                    },
                    {
                        where: {
                            id: userId,
                        },
                    },
                ),
            ]);
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

            throw new exceptions.InternalServerError('Failed to set user password', error);
        }
    }

    /**
     * Get user summary
     *
     * @param {object} filter
     * @param {string=} filter.dateFrom Start date
     * @param {string=} filter.dateTo End date
     * @returns {Promise<{
     * total_users: number,
     * periodic_summary: {
     *   [key: string]: {
     *      free: number,
     *      premium: number
     *  }
     * },
     * unique_signups: {
     *  free: number,
     *  premium: number
     *
     * }
     * }>}
     * @throws {InternalServerError} If failed to get users summary
     */
    async getUserSummary(filter) {
        try {
            let periodUnit = MONTHLY_PERIOD_UNIT;

            let periodLabelFormat = MONTHLY_PERIOD_LABEL_FORMAT;

            if (filter.period === WEEKLY_PERIOD) {
                periodUnit = WEEKLY_PERIOD_UNIT;

                periodLabelFormat = WEEKLY_PERIOD_LABEL_FORMAT;
            }

            const endDate = new Date(dateFns.format(filter.dateTo, DATE_FORMAT));

            const startDate = new Date(dateFns.format(filter.dateFrom, DATE_FORMAT));

            const summaryDate = [];

            for (let loopDate = startDate; loopDate <= endDate; loopDate = dateFns.add(loopDate, { [periodUnit]: 1 })) {
                let reformatLoopDate = loopDate;

                if (filter.period !== WEEKLY_PERIOD) {
                    reformatLoopDate = dateFns.startOfMonth(loopDate);
                }

                summaryDate.push({
                    start: dateFns.format(reformatLoopDate, DATE_FORMAT),
                    end: dateFns.format(filter.period !== WEEKLY_PERIOD ? dateFns.endOfMonth(reformatLoopDate) : reformatLoopDate, DATE_FORMAT),
                });
            }

            const summary = {};

            const summaryDateData = await Promise.all(
                summaryDate.map(async (date) =>
                    this.database.models.Users.findAll({
                        attributes: ['type_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                        group: ['type_id'],
                        where: {
                            account_type_id: USER_ACCOUNT_TYPE_ID,
                            created_at: {
                                [Sequelize.Op.gte]: dateFns.startOfDay(new dateFnsUtc.UTCDate(date.start)),
                                [Sequelize.Op.lte]: dateFns.endOfDay(new dateFnsUtc.UTCDate(date.end)),
                            },
                        },
                        raw: true,
                    }),
                ),
            );

            summaryDateData.forEach((dateData, index) => {
                summary[dateFns.format(summaryDate[index].start, periodLabelFormat)] = {
                    free: dateData.find((item) => item.type_id === FREE_USER_TYPE_ID)?.count || 0,
                    premium: dateData.find((item) => item.type_id === PREMIUM_USER_TYPE_ID)?.count || 0,
                };
            });

            const uniqueSignupData = await this.database.models.Users.findAll({
                attributes: ['type_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['type_id'],
                where: {
                    account_type_id: USER_ACCOUNT_TYPE_ID,
                    created_at: {
                        [Sequelize.Op.gte]: dateFns.startOfDay(new dateFnsUtc.UTCDate()),
                        [Sequelize.Op.lte]: dateFns.endOfDay(new dateFnsUtc.UTCDate()),
                    },
                },
                raw: true,
            });

            const uniqueSignup = {
                free: uniqueSignupData.find((item) => item.type_id === FREE_USER_TYPE_ID)?.count || 0,
                premium: uniqueSignupData.find((item) => item.type_id === PREMIUM_USER_TYPE_ID)?.count || 0,
            };

            uniqueSignup.total = uniqueSignup.free + uniqueSignup.premium;

            return {
                total_users: await this.database.models.Users.count({ where: { account_type_id: USER_ACCOUNT_TYPE_ID } }),
                periodic_summary: summary,
                unique_signups: uniqueSignup,
            };
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to get users summary', error);
        }
    }

    /**
     * Check if google id exist
     *
     * @param {string} googleId Google account id
     * @returns {Promise<boolean>}
     */
    async isGoogleIdExist(googleId) {
        try {
            return Boolean(await this.database.models.Users.count({ where: { google_id: googleId } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check google id', error);
        }
    }

    /**
     * Check if apple id exist
     *
     * @param {string} appleId Apple account id
     * @returns {Promise<boolean>}
     */
    async isAppleIdExist(appleId) {
        try {
            return Boolean(await this.database.models.Users.count({ where: { apple_id: appleId } }));
        } catch (error) {
            this.logger.error(error.message, error);

            throw new exceptions.InternalServerError('Failed to check apple id', error);
        }
    }

    /**
     * Deactivate non active accounts
     *
     * @returns {Promise<void>}
     * @throws {InternalServerError} If failed to deactivate inactive accounts
     */
    async deactivateInactiveAccounts() {
        try {
            const option = {
                account_type_id: USER_ACCOUNT_TYPE_ID,
                status_id: ACTIVE_STATUS_ID,
                last_login_at: {
                    [Sequelize.Op.lt]: new dateFnsUtc.UTCDate(
                        dateFns.format(dateFns.sub(new Date(), { days: INACTIVE_ACCOUNT_PERIOD_IN_DAYS }), DATE_FORMAT),
                    ),
                },
            };

            const deactivatedUsers = await this.database.models.Users.findAll({
                where: option,
            });

            await this.database.models.Users.update(
                { status_id: INACTIVE_STATUS_ID },
                {
                    where: option,
                },
            );

            return deactivatedUsers;
        } catch (error) {
            this.logger.error('Failed to deactivate inactive accounts', error);

            throw new exceptions.InternalServerError('Failed to deactivate inactive accounts', error);
        }
    }

    /**
     * Remove user subscription
     * @param {number} userId User account user id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to remove user subscription
     */
    async removeUserSubscription(userId) {
        try {
            await this.database.models.UserSubscriptions.update(
                { status: CANCELLED_PURCHASE_STATUS, cancel_at: new dateFnsUtc.UTCDate() },
                {
                    where: {
                        user_id: userId,
                    },
                },
            );

            return await this.database.models.Users.update(
                {
                    type_id: FREE_USER_TYPE_ID,
                },
                {
                    where: {
                        id: userId,
                    },
                },
            );
        } catch (error) {
            this.logger.error('Failed to remove user subscription', error);

            throw new exceptions.InternalServerError('Failed to remove user subscription', error);
        }
    }

    /**
     * Get user answer survey state
     * @param {number} userId User account user id
     * @returns {Promise<boolean>}
     * @throws {InternalServerError} If failed to get user answer survey state
     */
    async hasUserAnsweredSurvey(userId) {
        try {
            return Boolean(await this.database.models.UserSurveyQuestionAnswers.count({ where: { user_id: userId } }));
        } catch (error) {
            this.logger.error('Failed to get user answer survey state', error);

            throw new exceptions.InternalServerError('Failed to get user answer survey state', error);
        }
    }
}
