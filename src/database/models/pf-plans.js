import { CONTENT_CATEGORIES_TYPE } from '../../constants/index.js';

export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'PfPlans',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(300),
            },
            description: {
                type: DataTypes.TEXT,
            },
            content: {
                type: DataTypes.TEXT('long'),
            },
            photo: {
                type: DataTypes.STRING(300),
            },
            is_premium: {
                type: DataTypes.BOOLEAN,
            },
            status_id: {
                type: DataTypes.INTEGER,
                comment: 'see statuses table',
                references: {
                    model: 'statuses',
                    key: 'id',
                },
            },
            created_at: {
                type: DataTypes.DATE,
            },
            updated_at: {
                type: DataTypes.DATE,
            },
            deleted_at: {
                type: DataTypes.DATE,
            },
        },
        {
            sequelize,
            tableName: 'pf_plans',
            indexes: [
                {
                    name: 'pf_plans_status_id',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }],
                },
                {
                    name: 'pf_plans_name',
                    using: 'BTREE',
                    fields: [{ name: 'name' }],
                },
                {
                    name: 'pf_plans_status_id_name',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }, { name: 'name' }],
                },
                {
                    name: 'pf_plans_is_premium',
                    using: 'BTREE',
                    fields: [{ name: 'is_premium' }],
                },
                {
                    name: 'pf_plans_status_id_is_premium',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }, { name: 'is_premium' }],
                },
            ],
            scopes: {
                withStatus: () => ({
                    include: [
                        {
                            model: sequelize.models.Statuses,
                            as: 'status',
                            attributes: ['id', 'value'],
                            where: {},
                        },
                    ],
                }),
                withCategories: () => ({
                    include: [
                        {
                            model: sequelize.models.SurveyQuestionGroups,
                            as: 'categories',
                            attributes: ['id', ['description', 'value']],
                            through: {
                                as: 'content_categories',
                                attributes: [],
                            },
                            required: false,
                            where: {},
                        },
                    ],
                }),
                withUserPfPlanProgress: (options) => ({
                    include: [
                        {
                            model: sequelize.models.UserPfPlanProgress,
                            as: 'user_pf_plan_progress',
                            attributes: ['fulfilled', 'unfulfilled', 'skipped'],
                            required: false,
                            where: {
                                user_id: options?.userId,
                            },
                            limit: 1,
                            order: [['updated_at', 'DESC']],
                        },
                    ],
                }),
                withUserPfPlan: (options) => ({
                    include: [
                        {
                            model: sequelize.models.UserPfPlans,
                            as: 'user_pf_plan',
                            attributes: [],
                            required: false,
                            where: {
                                user_id: options?.userId,
                            },
                        },
                    ],
                }),
                withUserFavoritePfPlan: (options) => ({
                    include: [
                        {
                            model: sequelize.models.UserFavoritePfPlans,
                            as: 'user_favorite_pf_plans',
                            attributes: [],
                            required: true,
                            where: {
                                user_id: options?.userId,
                                is_favorite: options?.isFavorite ?? true,
                            },
                        },
                    ],
                }),
                defaultOrder: (custom) => {
                    if (custom) {
                        return {
                            order: custom,
                        };
                    }

                    return {
                        order: [
                            ['id', 'DESC'],
                            [
                                {
                                    model: sequelize.models.SurveyQuestionGroups,
                                    as: 'categories',
                                },
                                {
                                    model: sequelize.models.ContentCategories,
                                    as: 'content_categories',
                                },
                                'id',
                                'ASC',
                            ],
                        ],
                    };
                },
            },
        },
    );
    model.associate = () => {
        const { PfPlanDailies, Statuses, PfPlans, UserFavoritePfPlans, UserPfPlanProgress, UserPfPlans, ContentCategories, SurveyQuestionGroups } =
            sequelize.models;

        PfPlans.hasMany(PfPlanDailies, { as: 'pf_plan_dailies', foreignKey: 'pf_plan_id' });

        PfPlans.belongsTo(Statuses, { as: 'status', foreignKey: 'status_id' });

        PfPlans.hasMany(UserFavoritePfPlans, { as: 'user_favorite_pf_plans', foreignKey: 'pf_plan_id' });

        PfPlans.hasMany(UserPfPlanProgress, { as: 'user_pf_plan_progress', foreignKey: 'pf_plan_id' });

        PfPlans.hasMany(UserPfPlans, { as: 'user_pf_plan', foreignKey: 'pf_plan_id' });

        PfPlans.hasMany(ContentCategories, { as: 'content_categories', foreignKey: 'content_id' });

        PfPlans.belongsToMany(SurveyQuestionGroups, {
            as: 'categories',
            through: {
                model: ContentCategories,
                as: 'content_categories',
                scope: { content_type: CONTENT_CATEGORIES_TYPE.PF_PLAN },
            },
            foreignKey: 'content_id',
            otherKey: 'category_id',
        });
    };
    return model;
};
