'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import { LOCAL_MODE, LOCAL_USER } from './local-mode';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Local mode has no sign-in at all — start already "signed in" as the fixed
  // local identity so the dashboard renders immediately.
  const [user, setUser] = useState<User | null>(LOCAL_MODE ? (LOCAL_USER as unknown as User) : null);
  const [loading, setLoading] = useState(!LOCAL_MODE);

  useEffect(() => {
    if (LOCAL_MODE) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signOut: LOCAL_MODE ? async () => {} : () => firebaseSignOut(auth) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
