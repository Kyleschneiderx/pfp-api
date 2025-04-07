import { CONTENT_CATEGORIES_TYPE } from '../../constants/index.js';

export default (sequelize, DataTypes) => {
    const model = sequelize.define(
        'ContentCategories',
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            content_id: {
                type: DataTypes.INTEGER,
                comment: 'see educations, pf_plans tables',
            },
            content_type: {
                type: DataTypes.ENUM('educations', 'pf_plans'),
                comment: 'see educations, pf_plans tables',
            },
            category_id: {
                type: DataTypes.INTEGER,
                comment: 'see survey_question_groups table',
                references: {
                    model: 'survey_question_groups',
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
            tableName: 'content_categories',
            indexes: [
                {
                    name: 'content_categories_1',
                    using: 'BTREE',
                    fields: [{ name: 'category_id' }],
                },
                {
                    name: 'content_categories_2',
                    using: 'BTREE',
                    fields: [{ name: 'content_id' }, { name: 'content_type' }],
                },
                {
                    name: 'content_categories_3',
                    using: 'BTREE',
                    fields: [{ name: 'content_type' }, { name: 'category_id' }],
                },
                {
                    name: 'content_categories_4',
                    using: 'BTREE',
                    fields: [{ name: 'content_id' }, { name: 'content_type' }, { name: 'category_id' }],
                },
            ],
            scopes: {
                withEducations: () => ({
                    where: {
                        content_type: CONTENT_CATEGORIES_TYPE.EDUCATION,
                    },
                }),
                withPfPlans: () => ({
                    where: {
                        content_type: CONTENT_CATEGORIES_TYPE.PF_PLAN,
                    },
                }),
            },
            hooks: {
                afterFind: async (result, options) => {
                    if (!options?.scope?.includes('polymorph')) return;

                    if (!result) return;

                    const associate = async (row) => {
                        if (row.content_type === 'educations') {
                            const { Educations } = sequelize.models;
                            row.education = Educations.findByPk(row.content_id);
                        } else if (row.content_type === 'pf_plans') {
                            const { PfPlans } = sequelize.models;
                            row.pf_plan = PfPlans.findByPk(row.content_id);
                        }
                    };

                    if (Array.isArray(result)) {
                        result.forEach((entry) => associate(entry));
                    } else {
                        await associate(result);
                    }
                },
            },
        },
    );
    model.associate = () => {
        const { SurveyQuestionGroups, ContentCategories } = sequelize.models;

        ContentCategories.belongsTo(SurveyQuestionGroups, { as: 'category', foreignKey: 'category_id' });
    };
    return model;
};
