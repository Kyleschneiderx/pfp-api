import { CONTENT_CATEGORIES_TYPE } from '../../constants/index.js';

export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'Educations',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING(300),
            },
            description: {
                type: DataTypes.STRING(100),
            },
            content: {
                type: DataTypes.TEXT('long'),
            },
            photo: {
                type: DataTypes.STRING(300),
            },
            media_url: {
                type: DataTypes.STRING(300),
            },
            media_upload: {
                type: DataTypes.STRING(300),
            },
            reference_pf_plan_id: {
                type: DataTypes.INTEGER,
                comment: 'see pf_plans table',
                references: {
                    model: 'pf_plans',
                    key: 'id',
                },
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
            tableName: 'educations',
            indexes: [
                {
                    name: 'educations_title',
                    using: 'BTREE',
                    fields: [{ name: 'title' }],
                },
                {
                    name: 'educations_status_id',
                    using: 'BTREE',
                    fields: [{ name: 'status_id' }],
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
        const { Educations, Statuses, UserFavoriteEducations, ContentCategories, SurveyQuestionGroups } = sequelize.models;

        Educations.belongsTo(Statuses, { as: 'status', foreignKey: 'status_id' });

        Educations.hasMany(UserFavoriteEducations, { as: 'user_favorite_educations', foreignKey: 'education_id' });

        Educations.hasMany(ContentCategories, { as: 'content_categories', foreignKey: 'content_id' });

        Educations.belongsToMany(SurveyQuestionGroups, {
            as: 'categories',
            through: {
                model: ContentCategories,
                as: 'content_categories',
                scope: { content_type: CONTENT_CATEGORIES_TYPE.EDUCATION },
            },
            foreignKey: 'content_id',
            otherKey: 'category_id',
        });
    };
    return model;
};
