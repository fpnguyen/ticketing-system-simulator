import admin from 'firebase-admin';
import { env, firebaseConfigured } from './env.js';
import { logger } from '../utils/logger.js';

let firestore: admin.firestore.Firestore | null = null;

if (firebaseConfigured) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  firestore = admin.firestore();
  logger.info('Firebase Admin initialized');
} else {
  logger.warn('Firebase env vars not set — running without Firestore persistence');
}

export { firestore };
