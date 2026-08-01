import { UnauthorizedException } from '@nestjs/common';
import type { NextRequest } from 'next/server';
import { auth } from './firebase';
import { LOCAL_MODE, LOCAL_USER } from '../lib/local-mode';

export interface AuthUser {
  userId: string;
}

// Every route handler's first line — verifies the `Authorization: Bearer`
// header against Firebase Admin Auth. Never trust a client-supplied user id.
export async function requireUser(req: NextRequest): Promise<AuthUser> {
  // Local mode has no Firebase Auth to verify against, so every request runs
  // as the same fixed local identity. Gated on a build-time constant, so this
  // branch is stripped entirely from a production build.
  if (LOCAL_MODE) return { userId: LOCAL_USER.uid };

  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) throw new UnauthorizedException();

  try {
    const decoded = await auth.verifyIdToken(token);
    return { userId: decoded.uid };
  } catch {
    throw new UnauthorizedException();
  }
}
