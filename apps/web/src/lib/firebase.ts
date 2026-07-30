import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Local-only escape hatch: point Auth at the Firebase Auth Emulator instead
// of the real project, so the app is fully usable without touching
// production Firestore/Auth at all. Never true in a real deployment — only
// set via NEXT_PUBLIC_USE_FIREBASE_EMULATOR in a local .env.local.
// `_authEmulatorConnected` guards against Next.js Fast Refresh re-running
// this module and calling connectAuthEmulator twice, which throws.
declare global {
  // eslint-disable-next-line no-var
  var _authEmulatorConnected: boolean | undefined;
}
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !globalThis._authEmulatorConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  globalThis._authEmulatorConnected = true;
}
