import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getFirebaseApp(): App {
  return (
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  );
}

const app = getFirebaseApp();

// Enterprise-edition databases are named `default`, standard ones `(default)`.
export const db: Firestore = getFirestore(app, process.env.FIREBASE_DATABASE_ID ?? '(default)');
// Optional DTO fields arrive as `undefined`; without this Firestore rejects
// the whole write instead of omitting the field.
db.settings({ ignoreUndefinedProperties: true });

export const auth: Auth = getAuth(app);
