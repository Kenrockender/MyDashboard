import { Injectable } from '@nestjs/common';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseApp } from './firebase-app';

// Deliberately does not touch `firebase-admin/auth` — that pulls in an
// ESM-only JWT dependency that Jest can't load. Token verification lives in
// FirebaseAuthService so the data-layer tests stay loadable.
@Injectable()
export class FirebaseService {
  readonly db: Firestore;

  constructor() {
    // Enterprise-edition databases are named `default`, standard ones `(default)`.
    this.db = getFirestore(getFirebaseApp(), process.env.FIREBASE_DATABASE_ID ?? '(default)');
    // Optional DTO fields arrive as `undefined`; without this Firestore
    // rejects the whole write instead of omitting the field.
    this.db.settings({ ignoreUndefinedProperties: true });
  }
}
