/* eslint-disable node/no-unpublished-import */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

global.__dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env.testing'), override: true });

jest.setTimeout(1_000 * 300); // 20 seconds
