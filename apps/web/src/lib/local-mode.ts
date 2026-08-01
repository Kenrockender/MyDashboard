/**
 * Local mode: run the whole app with no Firebase project, no emulator, and no
 * sign-in. Data lives in memory in the dev server process (see
 * `src/server/local/local-store.ts`) and resets on restart.
 *
 * Enable with `NEXT_PUBLIC_LOCAL_MODE=true` in `.env.local`. Referenced by
 * both server and client code, so it must be a NEXT_PUBLIC_ var — Next.js
 * inlines these at build time, so this is a compile-time constant, not a
 * runtime lookup, and dead code is stripped from the production bundle.
 */
export const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';

/** The single fixed identity all local-mode requests run as. */
export const LOCAL_USER = {
  uid: 'local-user',
  email: 'you@local',
  displayName: 'Local User',
} as const;
