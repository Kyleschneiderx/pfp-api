import express from 'express';

export default ({ selectionController }) => {
    const router = express.Router();

    router.get('/', selectionController.handleSelectionsRoute.bind(selectionController));

    return router;
};
