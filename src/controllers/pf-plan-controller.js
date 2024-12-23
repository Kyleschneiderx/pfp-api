import {
    REPORT_DEFAULT_PAGE,
    REPORT_DEFAULT_ITEMS,
    ADMIN_ACCOUNT_TYPE_ID,
    PUBLISHED_PF_PLAN_STATUS_ID,
    FAVORITE_PF_PLAN_STATUS,
    UNFAVORITE_PF_PLAN_STATUS,
    PREMIUM_USER_TYPE_ID,
    SYSTEM_AUDITS,
} from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class PfPlanController {
    constructor({ pfPlanService, userService, loggerService }) {
        this.pfPlanService = pfPlanService;
        this.userService = userService;
        this.loggerService = loggerService;
    }

    async handleCreatePfPlanRoute(req, res) {
        const pfPlan = await this.pfPlanService.createPfPlan({
            name: req.body.name,
            description: req.body.description,
            content: req.body.content,
            statusId: req.body.status_id,
            photo: req?.files?.photo,
            dailies: req.body.dailies,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.CREATE_PF_PLAN);

        return res.status(201).json(pfPlan);
    }

    async handleGetPfPlansRoute(req, res) {
        const list = await this.pfPlanService.getPfPlans({
            authenticatedUser: req.auth,
            id: req.query.id,
            name: req.query.name,
            sort: req.query.sort,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_PF_PLAN_STATUS_ID,
            }),
        });

        return res.json(list);
    }

    async handleGetPfPlanRoute(req, res) {
        const workout = await this.pfPlanService.getPfPlanDetails(req.params.id, {
            authenticatedUser: req.auth,
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_PF_PLAN_STATUS_ID,
            }),
        });

        return res.json(workout);
    }

    async handleRemovePfPlanRoute(req, res) {
        await this.pfPlanService.removePfPlan(req.params.id);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_PF_PLAN);

        return res.json({ msg: 'Successfully removed PF plan.' });
    }

    async handleUpdatePfPlanRoute(req, res) {
        const workout = await this.pfPlanService.updatePfPlan({
            id: req.params.id,
            name: req.body.name,
            description: req.body.description,
            content: req.body.content,
            statusId: req.body.status_id,
            photo: req?.files?.photo,
            dailies: req.body.dailies,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.UPDATE_PF_PLAN);

        return res.json(workout);
    }

    async handleAddFavoritePfPlanRoute(req, res) {
        const userWorkoutFavorite = await this.pfPlanService.updateUserFavoritePfPlans(req.auth.user_id, req.params.id, FAVORITE_PF_PLAN_STATUS);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.ADD_FAVORITE_PF_PLAN);

        return res.json(userWorkoutFavorite);
    }

    async handleRemoveFavoritePfPlanRoute(req, res) {
        await this.pfPlanService.updateUserFavoritePfPlans(req.auth.user_id, req.params.id, UNFAVORITE_PF_PLAN_STATUS);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.REMOVE_FAVORITE_PF_PLAN);

        return res.json({ msg: 'Successfully removed PF plan to favorites.' });
    }

    async handleGetFavoritePfPlansRoute(req, res) {
        const favorites = await this.pfPlanService.getPfPlans({
            authenticatedUser: req.auth,
            id: req.query.id,
            name: req.query.name,
            statusId: PUBLISHED_PF_PLAN_STATUS_ID,
            favorite: {
                userId: req.auth.user_id,
            },
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });

        return res.json(favorites);
    }

    async handleSelectPfPlanRoute(req, res) {
        const user = await this.userService.getUser({ userId: req.auth.user_id });

        const pfPlanList = await this.pfPlanService.getPfPlans({
            id: req.params.id,
            authenticatedUser: req.auth,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });
        const pfPlan = pfPlanList.data[0];

        if (user.account_type_id !== ADMIN_ACCOUNT_TYPE_ID && pfPlan.is_premium && !(pfPlan.is_premium && user.type_id === PREMIUM_USER_TYPE_ID)) {
            throw new exceptions.Forbidden('You cannot access this content.');
        }

        await this.pfPlanService.selectPfPlan(req.params.id, req.auth.user_id, { isStartOver: req.body.is_start_over ?? false });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.SELECT_PF_PLAN);

        return res.json({ msg: 'Successfully selected PF plan.' });
    }

    async handleDeselectPfPlanRoute(req, res) {
        await this.pfPlanService.deselectPfPlan(req.params.id, req.auth.user_id);

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.DESELECT_PF_PLAN);

        return res.json({ msg: 'Successfully deselected PF plan.' });
    }

    async handleUpdatePfPlanProgressRoute(req, res) {
        const pfPlanProgress = await this.pfPlanService.updatePfPlanProgress(req.params.id, {
            userId: req.auth.user_id,
            content: req.pfPlanContent,
            pfPlanDaily: req.pfPlanDaily,
            isSkip: req.body.is_skip,
        });

        this.loggerService.logSystemAudit(req.auth.user_id, SYSTEM_AUDITS.UPDATE_PF_PLAN_PROGRESS);

        return res.json(pfPlanProgress);
    }
}
