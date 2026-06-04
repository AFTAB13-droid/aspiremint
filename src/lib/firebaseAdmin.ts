import * as admin from 'firebase-admin';

// Vercel friendly singleton pattern for serverless environments
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log("Firebase Admin SDK successfully initialized.");
    } catch (initErr) {
      console.error("Firebase Admin SDK initialization failure:", initErr);
    }
  } else {
    console.warn("Firebase Admin SDK credentials not fully configured in environment variables. Push notifications will be bypassed.");
  }
}

export const messaging = admin.messaging;
export default admin;
