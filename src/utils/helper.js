import crypto from 'crypto';
import * as dateFns from 'date-fns';
import { ASSET_URL, ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES } from '../constants/index.js';

export default class Helper {
    /**
     * Parse sort parameter for report query
     *
     * @param {Array} sort Array of sort query
     * @example [ [ { field }, { order } ] ]
     * @param {object} sortable Sortable fields
     * @example { { field }: { alias } }
     * @param {object} database Database instance to tailor the parsed sort to provided database instance
     * @returns {Array}
     */
    static parseSortList(array, sortable, database) {
        return array
            .filter((sort) => Object.keys(sortable).includes(sort[0]))
            .map((sort) => {
                sort[0] = database.col(sortable[sort[0]] ? `${sortable[sort[0]]}.${sort[0]}` : sort[0]);
                return sort;
            });
    }

    static generatePublicAssetUrl(path) {
        if (!path) return path;

        try {
            const urlObject = new URL(path);

            return path;
        } catch (error) {
            /** empty */
            return `${ASSET_URL}/${path}`;
        }
    }

    static generateAssetUrl(path) {
        if (!path) return path;

        try {
            const urlObject = new URL(path);
        } catch (error) {
            /** empty */
            path = `${ASSET_URL}/${path}`;
        }
        return this.generateProtectedUrl(path, { expiration: ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES });
    }

    static generateProtectedUrl(url, options = { expiration: 15 }) {
        if (url === undefined || url === null) return url;

        const urlObject = new URL(url);

        let urlBreakdown = urlObject.pathname.split('/');

        const file = urlBreakdown.pop();

        const [filename, filetype] = file.split('.');

        const expires = Date.now() + options.expiration * 60 * 1000;

        const secret = `${process.env.S3_ACCESS_KEY_ID}|${process.env.S3_SECRET_ACCESS_KEY}`;

        const hash = crypto.createHmac('sha256', secret).update(`${filename}:${expires}`).digest('hex');

        urlBreakdown = [...urlBreakdown, `${expires}:${hash}`, `${filename}.${filetype}`];

        return `${urlObject.origin}${urlBreakdown.join('/')}`;
    }

    static verifyProtectedUrl(token, filename) {
        const [expires, hash] = token.split(':');

        if (Date.now() > Number(expires) || Number.isNaN(Number(expires))) {
            return false;
        }

        const secret = `${process.env.S3_ACCESS_KEY_ID}|${process.env.S3_SECRET_ACCESS_KEY}`;

        const validHash = crypto.createHmac('sha256', secret).update(`${filename}:${expires}`).digest('hex');

        return hash === validHash;
    }

    static replacer = (string, replaceObj) => {
        if (typeof replaceObj === 'object') {
            Object.keys(replaceObj).forEach((key) => {
                string = string.replace(new RegExp(`{${key}}`, 'g'), replaceObj[key]);
            });
        }
        return string;
    };

    static toFixed(number, decimalPlace = 0) {
        const factor = 10 ** decimalPlace;

        return Math.trunc(number * factor) / factor;
    }

    static toPercent(number) {
        return number * 100;
    }

    static splitDateRangeIntoChunks(start, end, splitCount, format = 'yyyy-MM-dd') {
        const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const baseChunkSize = Math.floor(totalDays / splitCount);
        const remainder = totalDays % splitCount;
        const chunks = [];
        let currentStart = start;

        for (let i = 0; i < splitCount; i += 1) {
            const extraDay = i < remainder ? 1 : 0;
            const chunkSize = baseChunkSize + extraDay;
            const currentEnd = dateFns.addDays(currentStart, chunkSize - 1);

            chunks.push({
                start: dateFns.format(currentStart, format),
                end: dateFns.format(currentEnd > end ? end : currentEnd, format),
            });

            currentStart = dateFns.addDays(currentEnd, 1);
        }

        return chunks;
    }
}
