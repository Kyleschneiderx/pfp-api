import express from 'express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import routeV1Auth from './v1/auth.js';
import routeV1Users from './v1/users.js';
import routeV1Selections from './v1/selections.js';
import routeV1Verifications from './v1/verifications.js';
import routeV1ForgotPassword from './v1/forgot-password.js';
import routeV1Exercises from './v1/exercises.js';
import routeV1Workouts from './v1/workouts.js';
import routeV1PfPlans from './v1/pf-plans.js';
import routeV1Educations from './v1/educations.js';
import routeV1Miscellaneous from './v1/miscellaneous.js';
import routeV1Notifications from './v1/notifications.js';
import routeV1ChatAi from './v1/chat-ai.js';
import routeV1Settings from './v1/settings.js';
import routeAsset from './assets.js';
import routeScripts from './scripts.js';
import * as middlewares from '../middlewares/index.js';

export default ({
    apiLogger,
    jwt,
    file,
    password,
    authController,
    userController,
    userService,
    selectionController,
    selectionService,
    loggerService,
    authService,
    verificationController,
    verificationService,
    forgotPasswordController,
    exerciseController,
    exerciseService,
    helper,
    workoutController,
    workoutService,
    pfPlanController,
    pfPlanService,
    educationController,
    educationService,
    miscellaneousController,
    miscellaneousService,
    notificationController,
    revenuecat,
    database,
    fireStore,
    chatAiController,
    chatAiService,
    settingsController,
}) => {
    const router = express.Router();

    const verifyAuth = middlewares.verifyAuth({
        jwt: jwt,
        exceptions: ['/api/v1/users/signup'],
        userService: userService,
    });

    const verifyPremiumUser = middlewares.verifyPremiumUser({ userService });

    router.get('/chatbot', async (req, res) => {
        const messages = await chatAiService.getDemoConversation();

        return res.json({ messages: messages });
    });

    router.post('/chatbot', async (req, res) => {
        const response = await chatAiService.postMessageToAiCoach({
            userId: 3,
            message: req.body.message,
        });

        return res.json({ message: response.message });
    });

    router.delete('/chatbot', async (req, res) => {
        await chatAiService.resetDemoConversation();

        return res.status(204).send();
    });

    router.get('/chatbot/settings', async (req, res) => {
        const prompt = await chatAiService.getAiCoachPrompt();

        return res.json({
            prompt: prompt.value,
        });
    });

    router.put('/chatbot/settings', async (req, res) => {
        await chatAiService.updateAiCoachPrompt(req.body.prompt);

        return res.json({ message: 'Settings updated.' });
    });

    router.post('/v1/custom/upload', async (req, res) => {
        const { files } = req;

        res.json({
            body: req.body,
        });
    });

    router.use('/assets', routeAsset({ helper: helper }));

    router.use('/email-assets', express.static(path.join(__dirname, 'templates/assets')));

    router.post('/v1/custom/exercise', async (req, res) => {
        const fetchAsset = async (url) => {
            try {
                if (url.includes('drive.google')) {
                    const id = url.split('/view')[0].split('/').pop();
                    url = `https://drive.google.com/uc?export=download&id=${id}`;
                }
                const response = await fetch(url);
                const contentType = response.headers.get('content-type');
                const contentLength = response.headers.get('content-length');
                const arrayBuffer = await response.arrayBuffer();

                return {
                    name: `${uuidv4()}.${file.getExtensionByMimeType(contentType)?.toLowerCase()}`,
                    data: Buffer.from(arrayBuffer),
                    mimetype: contentType,
                    size: Number(contentLength),
                };
            } catch (error) {
                throw new Error('Failed to process asset URL.');
            }
        };

        const exercises = await Promise.all(
            req.body.map(async (body) => {
                const fetchResponse = await Promise.all([fetchAsset(body.photo), fetchAsset(body.video)]);

                return exerciseService.createExercise({
                    name: body.name,
                    categoryId: 2,
                    sets: body.sets,
                    reps: body.reps,
                    hold: body.hold,
                    description: body.description,
                    howTo: body.how_to,
                    photo: fetchResponse[0],
                    video: fetchResponse[1],
                });
            }),
        );

        res.status(201).json(exercises);
    });

    router.use(
        middlewares.apiLogger({
            logger: apiLogger,
            loggerService: loggerService,
        }),
    );

    router.use(
        '/v1/auths',
        routeV1Auth({
            authController: authController,
            userService: userService,
            password: password,
            authService: authService,
            verifyAuth: verifyAuth,
        }),
    );

    router.use(
        '/v1/verifications',
        routeV1Verifications({
            verificationController: verificationController,
            verificationService: verificationService,
            authService: authService,
            userController: userController,
            userService: userService,
        }),
    );

    router.use(
        '/v1/forgot-password',
        routeV1ForgotPassword({
            forgotPasswordController: forgotPasswordController,
            userService: userService,
            verificationService: verificationService,
            authService: authService,
            password: password,
        }),
    );

    router.use(
        '/v1/misc',
        routeV1Miscellaneous({
            miscellaneousController: miscellaneousController,
            miscellaneousService: miscellaneousService,
            revenuecat: revenuecat,
            verifyAuth: verifyAuth,
        }),
    );

    router.use(verifyAuth);

    router.use('/scripts', routeScripts({ verifyAdmin: middlewares.verifyAdmin, database, helper, fireStore }));

    router.use(
        '/v1/chat/ai',
        routeV1ChatAi({
            chatAiController: chatAiController,
        }),
    );

    router.use(
        '/v1/settings',
        routeV1Settings({
            verifyAdmin: middlewares.verifyAdmin,
            settingsController: settingsController,
        }),
    );

    router.use(
        '/v1/selections',
        routeV1Selections({
            verifyAdmin: middlewares.verifyAdmin,
            selectionController: selectionController,
            selectionService: selectionService,
            miscellaneousService: miscellaneousService,
        }),
    );

    router.use(
        '/v1/users',
        routeV1Users({
            verifyAdmin: middlewares.verifyAdmin,
            verifyUser: middlewares.verifyUser,
            userController: userController,
            userService: userService,
            selectionService: selectionService,
            file: file,
            verificationService: verificationService,
            authService: authService,
            password: password,
            pfPlanService: pfPlanService,
            miscellaneousService: miscellaneousService,
            verifyPremiumUser: verifyPremiumUser,
            educationService: educationService,
            exerciseService: exerciseService,
        }),
    );

    router.use(
        '/v1/exercises',
        routeV1Exercises({
            verifyAdmin: middlewares.verifyAdmin,
            exerciseController: exerciseController,
            exerciseService: exerciseService,
            selectionService: selectionService,
            file: file,
        }),
    );

    router.use(
        '/v1/workouts',
        routeV1Workouts({
            verifyAdmin: middlewares.verifyAdmin,
            verifyUser: middlewares.verifyUser,
            workoutController: workoutController,
            workoutService: workoutService,
            exerciseService: exerciseService,
            selectionService: selectionService,
            file: file,
            verifyPremiumUser: verifyPremiumUser,
        }),
    );

    router.use(
        '/v1/pf-plans',
        routeV1PfPlans({
            verifyAdmin: middlewares.verifyAdmin,
            verifyUser: middlewares.verifyUser,
            pfPlanController: pfPlanController,
            pfPlanService: pfPlanService,
            exerciseService: exerciseService,
            selectionService: selectionService,
            file: file,
            educationService: educationService,
            verifyPremiumUser: verifyPremiumUser,
        }),
    );

    router.use(
        '/v1/educations',
        routeV1Educations({
            verifyAdmin: middlewares.verifyAdmin,
            verifyUser: middlewares.verifyUser,
            educationController: educationController,
            educationService: educationService,
            selectionService: selectionService,
            file: file,
            pfPlanService: pfPlanService,
            verifyPremiumUser: verifyPremiumUser,
        }),
    );

    router.use(
        '/v1/notifications',
        routeV1Notifications({
            verifyUser: middlewares.verifyUser,
            notificationController: notificationController,
            verifyPremiumUser: verifyPremiumUser,
        }),
    );

    router.get('/', (req, res) => {
        res.send('Welcome!');
    });

    return router;
};
