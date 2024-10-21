import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import mime from 'mime-types';

export default class File {
    static dir = path.dirname(fileURLToPath(import.meta.url));

    static bytePerKb = 1024;

    static toKb = (size = undefined) => size / this.bytePerKb;

    static toMb = (size = undefined) => this.toKb(size) / this.bytePerKb;

    static toGb = (size = undefined) => this.toMb(size) / this.bytePerKb;

    static removeDirectory = (filepath) => {
        if (!fs.existsSync(filepath)) {
            return;
        }

        fs.readdirSync(filepath).forEach((file) => {
            const currentPath = path.join(filepath, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                this.removeDirectory(currentPath);
            } else {
                fs.unlinkSync(currentPath);
            }
        });
        fs.rmdirSync(filepath);
    };

    static isValidFileSize = (fileSize, maxSize, unit = 'MB') => {
        switch (unit) {
            case 'B':
                return fileSize <= maxSize;
            case 'KB':
                return this.toKb(fileSize) <= maxSize;
            case 'MB':
                return this.toMb(fileSize) <= maxSize;
            case 'GB':
                return this.toGb(fileSize) <= maxSize;
            default:
                return false;
        }
    };

    static extractExtension = (fileName) => {
        if (fileName === undefined) {
            return false;
        }

        const extenstion = fileName.split('.')[fileName.split('.').length - 1];

        return extenstion.toString().toLowerCase();
    };

    static getMimeTypeByExtension = (extension) => {
        try {
            return mime.contentType(extension);
        } catch (error) {
            throw new Error('Error on getting mime type by extension.', { cause: error });
        }
    };

    static getExtensionByMimeType = (mimeType) => {
        try {
            return mime.extension(mimeType);
        } catch (error) {
            throw new Error('Error on getting extension by mime type.', { cause: error });
        }
    };

    static readFile(filePath, options = {}) {
        return fs.readFileSync(filePath, options);
    }

    static async resizeImage(buffer, width, height, options = {}) {
        try {
            const metadata = await sharp(buffer).metadata();

            let resizeWidth;
            let resizeHeight;

            if (options?.force) {
                resizeWidth = width;
                resizeHeight = height;
            } else if (metadata.width > metadata.height) {
                resizeWidth = metadata.width > width ? width : metadata.width;
                resizeHeight = null;
            } else {
                resizeWidth = null;
                resizeHeight = metadata.height > height ? height : metadata.height;
            }

            return sharp(buffer).resize(resizeWidth, resizeHeight).toBuffer();
        } catch (error) {
            throw new Error('Error on resizing image.', { cause: error });
        }
    }
}
