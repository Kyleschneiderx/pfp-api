export default ({ logger }) =>
    (err, req, res, next) => {
        let message;
        try {
            message = JSON.parse(err.message);
        } catch (error) {
            /* empty */
        }

        if (message === null || message === undefined) {
            message = 'An error occured. Please try again later.';
            logger.error(err.message, err);
        }
        return res.status(err.statusCode ?? 500).json({ error: typeof message === 'string' ? [{ msg: message }] : [message], code: err.statusCode });
    };
