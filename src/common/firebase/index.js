import admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

admin.firestore().settings({
    ignoreUndefinedProperties: true,
    databaseId: process.env.FIREBASE_FIRESTORE_DB,
});

export default admin;
