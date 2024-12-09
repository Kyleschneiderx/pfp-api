import express from 'express';
import validateInput from '../../middlewares/validate-input.js';
import * as validations from '../../middlewares/validations/users/index.js';
import * as commonValidations from '../../middlewares/validations/common/index.js';

export default ({
    verifyAdmin,
    verifyUser,
    verifyPremiumUser,
    userController,
    userService,
    file,
    selectionService,
    verificationService,
    authService,
    password,
    pfPlanService,
    miscellaneousService,
}) => {
    const router = express.Router();

    router.post(
        '/signup',
        validateInput(validations.signupValidation({ userService, file, verificationService, authService })),
        userController.handleUserSignupRoute.bind(userController),
    );

    router.get('/summary', [verifyAdmin], userController.handleGetUserSummaryRoute.bind(userController));

    router.put(
        '/setup-password',
        [validateInput(validations.setupPasswordValidation({ userService, password })), verifyUser],
        userController.handleSetupPasswordRoute.bind(userController),
    );

    router.delete('/delete-account', [verifyUser], userController.handleRemoveUserViaAppRoute.bind(userController));

    router.get(
        '/:user_id',
        validateInput([commonValidations.userAccessUserIdValidation({ userService })]),
        userController.handleGetUserRoute.bind(userController),
    );

    router.put(
        '/:user_id/survey',
        [validateInput(validations.updateUserSurveyAnswerValidation({ userService, miscellaneousService })), verifyUser],
        userController.handleUpdateUserSurveyRoute.bind(userController),
    );

    router.get(
        '/:user_id/account-type',
        [validateInput([commonValidations.userAccessUserIdValidation({ userService })]), verifyUser],
        userController.handleVerifyUserType.bind(userController),
    );

    router.get(
        '/:user_id/subscription',
        [validateInput([commonValidations.userAccessUserIdValidation({ userService })]), verifyUser],
        userController.handleVerifySubscription.bind(userController),
    );

    router.put(
        '/:user_id/photo',
        [
            validateInput([
                commonValidations.userAccessUserIdValidation({ userService }),
                ...commonValidations.photoValidation({ field: 'photo', file: file, isRequired: true }),
            ]),
            verifyUser,
        ],
        userController.handleUploadUserPhotoRoute.bind(userController),
    );

    router.use(verifyPremiumUser);

    router.put(
        '/:user_id/password',
        [validateInput(validations.changePasswordValidation({ userService, password })), verifyUser],
        userController.handleChangePasswordRoute.bind(userController),
    );

    router.get(
        '/:user_id/pf-plan-progress',
        [validateInput(validations.getUserPfPlanProgressValidation({ userService, pfPlanService })), verifyUser],
        userController.handleGetUserPfPlanProgressRoute.bind(userController),
    );

    router.get(
        '/:user_id/pf-plan-progress/stats',
        [validateInput(validations.getUserPfPlanProgressValidation({ userService, pfPlanService })), verifyUser],
        userController.handleGetUserPfPlanProgressStatisticsRoute.bind(userController),
    );

    router.use(verifyAdmin);

    router.post(
        '/:user_id/invite',
        validateInput([validations.sendInviteValidation({ userService })]),
        userController.handleSendUserInviteRoute.bind(userController),
    );

    router.post(
        '/',
        validateInput(validations.createUserValidation({ userService, file, selectionService })),
        userController.handleCreateUserRoute.bind(userController),
    );

    router.put(
        '/:user_id',
        validateInput(validations.updateUserValidation({ userService, file, selectionService })),
        userController.handleUpdateUserRoute.bind(userController),
    );

    router.delete(
        '/:user_id',
        validateInput(validations.removeUserValidation({ userService })),
        userController.handleRemoveUserRoute.bind(userController),
    );

    router.get('/', validateInput(validations.getUsersValidation()), userController.handleGetUsersRoute.bind(userController));

    router.delete(
        '/:user_id/photo',
        validateInput([commonValidations.userIdValidation({ userService })]),
        userController.handleRemoveUserPhotoRoute.bind(userController),
    );

    return router;
};
