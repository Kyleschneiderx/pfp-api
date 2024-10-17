import {
    REPORT_DEFAULT_PAGE,
    REPORT_DEFAULT_ITEMS,
    ADMIN_ACCOUNT_TYPE_ID,
    FAVORITE_EDUCATION_STATUS,
    UNFAVORITE_EDUCATION_STATUS,
    PUBLISHED_EDUCATION_STATUS_ID,
} from '../constants/index.js';

export default class EducationController {
    constructor({ educationService, userService, notificationService }) {
        this.educationService = educationService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    async handleCreateEducationRoute(req, res) {
        const education = await this.educationService.createEducation({
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            mediaUrl: req.body.media_url,
            mediaUpload: req?.files?.media_upload,
            photo: req?.files?.photo,
            statusId: req.body.status_id,
            referencePfPlanId: req.body.reference_pf_plan_id,
        });

        return res.status(201).json(education);
    }

    async handleGetEducationsRoute(req, res) {
        const list = await this.educationService.getEducations({
            id: req.query.id,
            title: req.query.title,
            statusId: req.query.status_id,
            sort: req.query.sort,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_EDUCATION_STATUS_ID,
            }),
        });
        return res.json(list);
    }

    async handleGetEducationRoute(req, res) {
        const education = await this.educationService.getEducationDetails(req.params.id, {
            authenticatedUser: req.auth,
            ...(ADMIN_ACCOUNT_TYPE_ID !== req.auth.account_type_id && {
                statusId: PUBLISHED_EDUCATION_STATUS_ID,
            }),
        });

        return res.json(education);
    }

    async handleRemoveEducationRoute(req, res) {
        await this.educationService.removeEducation(req.params.id);

        return res.json({ msg: 'Successfully removed education.' });
    }

    async handleUpdateEducationRoute(req, res) {
        const education = await this.educationService.updateEducation({
            id: req.params.id,
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            mediaUrl: req.body.media_url,
            mediaUpload: req?.files?.media_upload,
            photo: req?.files?.photo,
            statusId: req.body.status_id,
            referencePfPlanId: req.body.reference_pf_plan_id,
        });

        return res.json(education);
    }

    async handleAddFavoriteEducationRoute(req, res) {
        const userWorkoutFavorite = await this.educationService.updateUserFavoriteEducations(
            req.auth.user_id,
            req.params.id,
            FAVORITE_EDUCATION_STATUS,
        );

        return res.json(userWorkoutFavorite);
    }

    async handleRemoveFavoriteEducationRoute(req, res) {
        await this.educationService.updateUserFavoriteEducations(req.auth.user_id, req.params.id, UNFAVORITE_EDUCATION_STATUS);
        return res.json({ msg: 'Successfully removed education to favorites.' });
    }

    async handleGetFavoriteEducationsRoute(req, res) {
        const favorites = await this.educationService.getFavoriteEducations({
            userId: req.auth.user_id,
            id: req.query.id,
            title: req.query.title,
            page: req.query.page ?? REPORT_DEFAULT_PAGE,
            pageItems: req.query.page_items ?? REPORT_DEFAULT_ITEMS,
        });

        return res.json(favorites);
    }
}
