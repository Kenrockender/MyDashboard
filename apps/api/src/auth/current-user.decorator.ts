import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: string;
}

// TEMPORARY: returns a fixed user id for every request so Phase 1-4 can be
// built and tested before real auth exists. Replaced with verified Clerk
// sessions in Phase 5 — see 06-Development-Roadmap.md Phase 5. Every
// controller from here on reads the user via @CurrentUser(), never a
// client-supplied field, so swapping this implementation later doesn't
// touch any controller code.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    return { userId: process.env.DEV_USER_ID ?? 'user_dev' };
  },
);
