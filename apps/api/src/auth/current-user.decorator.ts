import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  userId: string;
}

declare module 'express' {
  interface Request {
    auth?: AuthUser;
  }
}

// Populated by FirebaseAuthGuard from the verified ID token — never trust a
// client-supplied field for this.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.auth!;
  },
);
