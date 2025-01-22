export const DATE_FORMAT = 'yyyy-MM-dd';

export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export const DATE_YEAR_MONTH_FORMAT = 'yyyy-MM';

export const TIME_FORMAT = 'HH:mm:ss';

export const MONTHLY_PERIOD = 'monthly';

export const WEEKLY_PERIOD = 'weekly';

export const MONTHLY_PERIOD_UNIT = 'months';

export const WEEKLY_PERIOD_UNIT = 'days';

export const MONTHLY_PERIOD_LABEL_FORMAT = 'MMM';

export const WEEKLY_PERIOD_LABEL_FORMAT = 'MMM dd';

export const MONTHLY_RANGE_PERIOD = 11;

export const WEEKLY_RANGE_PERIOD = 6;

export const AUTH_TOKEN_EXPIRATION_IN_MINUTES = 60;

export const USER_ACCOUNT_TYPE_ID = 2;

export const ADMIN_ACCOUNT_TYPE_ID = 1;

export const FREE_USER_TYPE_ID = 1;

export const PREMIUM_USER_TYPE_ID = 2;

export const ACTIVE_STATUS_ID = 1;

export const INACTIVE_STATUS_ID = 2;

export const REPORT_DEFAULT_ITEMS = 50;

export const REPORT_DEFAULT_PAGE = 1;

export const ALLOWED_PHOTO_TYPE = ['jpg', 'jpeg', 'png'];

export const ALLOWED_VIDEO_TYPE = ['mp4'];

export const ALLOWED_AUDIO_TYPE = ['m4a', 'flac', 'mp3', 'wav', 'aac'];

export const MAX_PHOTO_SIZE_IN_MB = 5;

export const MAX_VIDEO_SIZE_IN_MB = 150;

export const MAX_AUDIO_SIZE_IN_MB = 20;

export const OTP_RESEND_IN_SECONDS = 120;

export const OTP_EXPIRATION_IN_SECONDS = 3600;

export const EMAIL_CONFIRMATION_URL = `${process.env.APP_URL}/verification/email`;

export const WEB_RESET_PASSWORD_URL = `${process.env.WEB_URL}/reset-password`;

export const APP_RESET_PASSWORD_URL = `${process.env.MOBILE_URL}/forgot-password/reset`;

export const APP_SETUP_ACCOUNT_URL = `${process.env.MOBILE_URL}/account?token=`;

export const DEFAULT_RESET_PASSWORD_REQUEST_STATUS_ID = 1;

export const USED_RESET_PASSWORD_REQUEST_STATUS_ID = 3;

export const RESET_PASSWORD_EXPIRATION_IN_SECONDS = 3600;

export const USER_PHOTO_PATH = `${process.env.APP_ENV}/user-photo`;

export const USER_PHOTO_HEIGHT = 200;

export const USER_PHOTO_WIDTH = 200;

export const ASSET_URL = `${process.env.APP_URL}/api/assets`;

export const S3_OBJECT_URL = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`;

export const EXERCISE_PHOTO_PATH = `${process.env.APP_ENV}/exercises-photo`;

export const EXERCISE_VIDEO_PATH = `${process.env.APP_ENV}/exercises-video`;

export const EXERCISE_AUDIO_PATH = `${process.env.APP_ENV}/exercises-audio`;

export const ASSETS_ENDPOINT_EXPIRATION_IN_MINUTES = 60;

export const DRAFT_WORKOUT_STATUS_ID = 4;

export const PUBLISHED_WORKOUT_STATUS_ID = 5;

export const FAVORITE_WORKOUT_STATUS = true;

export const UNFAVORITE_WORKOUT_STATUS = false;

export const WORKOUT_PHOTO_PATH = `${process.env.APP_ENV}/workout-photo`;

export const DRAFT_PF_PLAN_STATUS_ID = 4;

export const PUBLISHED_PF_PLAN_STATUS_ID = 5;

export const PFPLAN_PHOTO_PATH = `${process.env.APP_ENV}/pf-plan-photo`;

export const DRAFT_EDUCATION_STATUS_ID = 4;

export const PUBLISHED_EDUCATION_STATUS_ID = 5;

export const EDUCATION_PHOTO_PATH = `${process.env.APP_ENV}/education-photo`;

export const EDUCATION_MEDIA_PATH = `${process.env.APP_ENV}/education-media`;

export const FAVORITE_EDUCATION_STATUS = true;

export const UNFAVORITE_EDUCATION_STATUS = false;

export const FAVORITE_PF_PLAN_STATUS = true;

export const UNFAVORITE_PF_PLAN_STATUS = false;

export const NOTIFICATIONS = {
    WELCOME: 1,
    ACCOUNT_INACTIVE: 2,
    NEW_WORKOUT: 3,
    NEW_EDUCATION: 4,
    NEW_PF_PLAN: 5,
    DAILY_PF_PLAN_REMINDER: 6,
};

export const INACTIVE_ACCOUNT_PERIOD_IN_DAYS = 30;

export const PF_PLAN_PROGRESS_RETENTION_PERION_IN_DAYS = 30;

export const SYSTEM_AUDITS = {
    CREATE_ACCOUNT: 1,
    UPDATE_ACCOUNT: 2,
    REMOVE_ACCOUNT: 3,
    SEND_INVITE: 4,
    FORGOT_PASSWORD: 5,
    RESET_PASSWORD: 6,
    CHANGE_PASSWORD: 7,
    SETUP_PASSWORD: 8,
    CREATE_EXERCISE: 9,
    UPDATE_EXERCISE: 10,
    REMOVE_EXERCISE: 11,
    CREATE_WORKOUT: 12,
    UPDATE_WORKOUT: 13,
    REMOVE_WORKOUT: 14,
    CREATE_PF_PLAN: 15,
    UPDATE_PF_PLAN: 16,
    REMOVE_PF_PLAN: 17,
    CREATE_EDUCATION: 18,
    UPDATE_EDUCATION: 19,
    REMOVE_EDUCATION: 20,
    REMOVE_SUBSCRIPTION: 21,
    CREATE_SUBSCRIPTION_PAYMENT: 22,
    SUBSCRIBE: 23,
    UPDATE_PF_PLAN_PROGRESS: 24,
    LOGIN: 25,
    SUBMIT_SURVEY: 26,
    ADD_FAVORITE_WORKOUT: 27,
    REMOVE_FAVORITE_WORKOUT: 28,
    ADD_FAVORITE_PF_PLAN: 29,
    REMOVE_FAVORITE_PF_PLAN: 30,
    ADD_FAVORITE_EDUCATION: 31,
    REMOVE_FAVORITE_EDUCATION: 32,
    REGISTER: 33,
    SELECT_PF_PLAN: 34,
    DESELECT_PF_PLAN: 35,
};

export const CONTACT_SUPPORT_NAME = process.env.SUPPORT_NAME;

export const CONTACT_SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

export const GOOGLE_PAYMENT_PLATFORM = 'google_play';

export const APPLE_PAYMENT_PLATFORM = 'app_store';

export const PAID_PURCHASE_STATUS = 'purchased';

export const EXPIRED_PURCHASE_STATUS = 'expired';

export const CANCELLED_PURCHASE_STATUS = 'canceled';

export const GOOGLE_PAY_PAYMENT_RECEIVED = 1;

export const GOOGLE_PAY_FREE_TRIAL = 2;

export const SUBSCRIPTION_PRODUCTS = {
    pelvic_floor_pro_weekly_subscription: 'Pelvic Floor Pro Weekly Subscription',
    pelvic_floor_pro_yearly_subscription: 'Pelvic Floor Pro Yearly Premium',
};

export const EMAIL_ASSETS_URL = `${process.env.APP_URL}/api/email-assets`;
