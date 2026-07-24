const MESSAGES: Record<string, string> = {
  // Popup / redirect flow
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
  'auth/unauthorized-domain':
    'This domain is not authorized in the Firebase console (Authentication → Settings → Authorized domains).',
  'auth/account-exists-with-different-credential':
    'An account already exists with that email using a different sign-in method.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled for this Firebase project.',
  // General
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return code ? `Something went wrong (${code}).` : 'Something went wrong.';
}
