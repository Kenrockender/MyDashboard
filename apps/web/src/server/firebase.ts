import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { LOCAL_MODE, LOCAL_USER } from '../lib/local-mode';
import { createLocalDb } from './local/local-store';

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

function createFirestoreDb(app: App): Firestore {
  const instance = getFirestore(app, process.env.FIREBASE_DATABASE_ID ?? '(default)');
  // Optional DTO fields arrive as `undefined`; without this Firestore rejects
  // the whole write instead of omitting the field.
  instance.settings({ ignoreUndefinedProperties: true });
  return instance;
}

// In LOCAL_MODE nothing talks to Firebase, so the Admin SDK is never
// initialized — that's what lets the app run with no credentials at all.
const app: App | undefined = LOCAL_MODE ? undefined : getFirebaseApp();

export const db: Firestore = LOCAL_MODE
  ? (createLocalDb(LOCAL_USER.uid) as unknown as Firestore)
  : createFirestoreDb(app!);

export const auth: Auth = LOCAL_MODE ? ({} as Auth) : getAuth(app!);
