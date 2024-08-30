import { createLogger, format, transports } from 'winston';

const date = new Date();

const consoleLog = new transports.Console({
    format: format.combine(
        format.colorize({ all: true }),
        format.errors({ stack: true }),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf((info) => {
            if (info.stack !== undefined) {
                info.stack = `\n${info.stack}`;
            }
            return `${info.timestamp} [${info.level}] ${info.message}${info?.stack ?? ''}`;
        }),
    ),
});

const fileErrorLog = new transports.File({
    level: 'error',
    filename: `./logs/error/error_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}.log`,
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
});

const fileLog = new transports.File({
    filename: `./logs/combined/combined_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}.log`,
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
});

const fileApiLog = new transports.File({
    filename: `./logs/api/api_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}.log`,
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf(({ timestamp, level, message }) =>
            JSON.stringify({
                level: level,
                log: message,
                timestamp: timestamp,
            }),
        ),
    ),
});

export default (options) => {
    const transport = [];

    if (options?.console === undefined || options?.console) {
        transport.push(consoleLog);
    }

    if (options?.type === 'api') {
        return createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: format.json(),
            transports: [...transport, fileApiLog],
        });
    }

    return createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: format.json(),
        transports: [...transport, fileLog, fileErrorLog],
    });
};
