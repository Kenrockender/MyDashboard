import { UnauthorizedException } from '@nestjs/common';
import type { NextRequest } from 'next/server';
import { auth } from './firebase';

export interface AuthUser {
  userId: string;
}

// Every route handler's first line — verifies the `Authorization: Bearer`
// header against Firebase Admin Auth. Never trust a client-supplied user id.
export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) throw new UnauthorizedException();

  try {
    const decoded = await auth.verifyIdToken(token);
    return { userId: decoded.uid };
  } catch {
    throw new UnauthorizedException();
  }
}
