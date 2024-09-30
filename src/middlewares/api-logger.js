import requestIp from 'request-ip';

export default ({ logger, loggerService }) =>
    async (req, res, next) => {
        const files = {};
        if (req.files) {
            Object.keys(req.files).forEach((key) => {
                const file = { ...req.files[key] };
                delete file.data;
                files[key] = file;
            });
        }

        const log = {
            endpoint: req.originalUrl,
            method: req.method,
            ip: requestIp.getClientIp(req),
            request_header: JSON.stringify(req.headers),
            request: JSON.stringify({
                query: req.query,
                body: req.body,
                params: req.params,
                files: files,
            }),
            response_header: null,
            response: null,
            status_code: null,
            created_at: new Date(),
            updated_at: new Date(),
            response_at: null,
            deleted_at: null,
        };

        const oldSend = res.send;
        res.send = (content) => {
            res.contentBody = content;
            res.send = oldSend;
            res.send(content);
        };

        res.on('finish', async () => {
            log.response_header = JSON.stringify(res.getHeaders());
            log.response = res.contentBody;
            log.status_code = res.statusCode;
            log.response_at = new Date();

            if (loggerService !== undefined) {
                loggerService.logApiRequest(log);
            }

            if (logger !== undefined) {
                logger.info(log);
            }
        });

        return next();
    };
