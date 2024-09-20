export default ({ logger }) =>
    (err, req, res, next) => {
        let { message } = err;
        try {
            message = JSON.parse(message);
        } catch (error) {
            /* empty */
        }

        if (err.isCustom === null || err.isCustom === undefined || err.isCustom === false) {
            message = 'An error occured. Please try again later.';
            logger.error(err.message, err);
        }

        const photo = req?.files?.photo;

        if (photo !== undefined) {
            delete photo.data;
        }
        return res
            .status(err.statusCode ?? 500)
            .json({ error: typeof message === 'string' ? [{ msg: message }] : [message], code: err.statusCode, file: photo });
    };
