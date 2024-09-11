export const USER_ACCOUNT_TYPE_ID = 2;

export const ADMIN_ACCOUNT_TYPE_ID = 1;

export const FREE_USER_TYPE_ID = 1;

export const PREMIUM_USER_TYPE_ID = 2;

export const ACTIVE_STATUS_ID = 1;

export const REPORT_DEFAULT_ITEMS = 50;

export const REPORT_DEFAULT_PAGE = 1;

export const ALLOWED_PHOTO_TYPE = ['jpg', 'jpeg', 'png'];

export const ALLOWED_VIDEO_TYPE = ['mp4', 'avi', 'mov'];

export const MAX_PHOTO_SIZE_IN_MB = 5;

export const MAX_VIDEO_SIZE_IN_MB = 20;

export const OTP_RESEND_IN_SECONDS = 120;

export const OTP_EXPIRATION_IN_SECONDS = 300;

export const EMAIL_CONFIRMATION_URL = `${process.env.APP_URL}/verification/email`;

export const WEB_RESET_PASSWORD_URL = `${process.env.WEB_URL}/forgot-password/reset`;

export const APP_RESET_PASSWORD_URL = `${process.env.MOBILE_URL}/forgot-password/reset`;

export const DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID = 1;

export const USED_RESET_PASSWORD_REQUEST_STATUS_ID = 3;

export const USER_PHOTO_PATH = 'user-photo';

export const USER_PHOTO_HEIGHT = 200;

export const USER_PHOTO_WIDTH = 200;

export const ASSET_URL = `${process.env.APP_URL}/api/assets`;

export const S3_OBJECT_URL = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`;
