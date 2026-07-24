import { Injectable } from '@nestjs/common';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirebaseApp } from './firebase-app';

@Injectable()
export class FirebaseAuthService {
  private readonly auth: Auth = getAuth(getFirebaseApp());

  async verifyIdToken(token: string): Promise<string> {
    const decoded = await this.auth.verifyIdToken(token);
    return decoded.uid;
  }
}
