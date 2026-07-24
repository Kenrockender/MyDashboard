import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';

export function getFirebaseApp(): App {
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
