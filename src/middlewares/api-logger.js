export default ({ logger, apiLogger, models }) =>
    async (req, res, next) => {
        const log = {
            endpoint: req.originalUrl,
            method: req.method,
            request_header: req.header,
            request: {
                query: req.query,
                body: req.body,
                params: req.params,
            },
            response_header: null,
            response: null,
            status_code: null,
            created_at: new Date(),
            updated_at: new Date(),
            response_at: null,
            deleted_at: null,
        };

        let logInfo;
        if (models !== undefined && models.ApiLogs !== undefined) {
            try {
                logInfo = await models.ApiLogs.create(log);
            } catch (error) {
                logger.error('Unable to log api request.', { stack: error.stack });
            }
        }

        const oldSend = res.send;
        res.send = (content) => {
            res.contentBody = content;
            res.send = oldSend;
            res.send(content);
        };

        res.on('finish', async () => {
            try {
                if (logInfo !== undefined) {
                    logInfo.response_header = JSON.stringify(res.getHeaders());
                    logInfo.response = res.contentBody;
                    logInfo.status_code = res.statusCode;
                    logInfo.response_at = new Date();
                    await logInfo.save();
                }

                if (apiLogger !== undefined) {
                    apiLogger.info(log);
                }
            } catch (error) {
                logger.error('Unable to update api request for response details.', { stack: error.stack });
            }
        });

        next();
    };
