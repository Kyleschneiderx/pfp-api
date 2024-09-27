import { REPORT_DEFAULT_PAGE, REPORT_DEFAULT_ITEMS, PREMIUM_USER_TYPE_ID, ADMIN_ACCOUNT_TYPE_ID } from '../constants/index.js';
import * as exceptions from '../exceptions/index.js';

export default class PfPlanController {
    constructor({ pfPlanService, userService }) {
        this.pfPlanService = pfPlanService;
        this.userService = userService;
    }

    async handleCreatePfPlanRoute(req, res) {
        const pfPlan = await this.pfPlanService.createPfPlan({
            name: req.body.name,
            description: req.body.description,
            statusId: req.body.status_id,
            photo: req?.files?.photo,
            dailies: req.body.dailies,
        });
        return res.status(201).json(pfPlan);
    }

    async handleGetPfPlansRoute(req, res) {
        const list = await this.pfPlanService.getPfPlans({
            id: req.query.id,
            name: req.query.name,
            sort: req.query.sort,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });
        return res.json(list);
    }

    async handleGetPfPlanRoute(req, res) {
        const user = await this.userService.getUser({ userId: req.auth.user_id });

        const workout = await this.pfPlanService.getPfPlanDetails(req.params.id);

        if (user.account_type_id !== ADMIN_ACCOUNT_TYPE_ID && !(workout.is_premium && user.type_id === PREMIUM_USER_TYPE_ID)) {
            throw new exceptions.Forbidden('You cannot access this content.');
        }

        return res.json(workout);
    }

    async handleRemovePfPlanRoute(req, res) {
        await this.pfPlanService.removePfPlan(req.params.id);

        return res.json({ msg: 'Successfully removed PF plan.' });
    }

    async handleUpdatePfPlanRoute(req, res) {
        const workout = await this.pfPlanService.updatePfPlan({
            id: req.params.id,
            name: req.body.name,
            description: req.body.description,
            statusId: req.body.status_id,
            photo: req?.files?.photo,
            dailies: req.body.dailies,
        });
        return res.json(workout);
    }
}
