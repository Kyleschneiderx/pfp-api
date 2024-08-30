export default (err, req, res, next) => {
    let message;
    try {
        message = JSON.parse(err.message);
    } catch (error) {
        /* empty */
    }
    return res.status(err.statusCode ?? 500).json({ error: typeof message === 'string' ? [{ msg: message }] : [message], code: err.statusCode });
};
