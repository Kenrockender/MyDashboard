import { auth } from './firebase';
import { LOCAL_MODE } from './local-mode';

const API_URL = '/api';

// Local mode has no signed-in Firebase user to mint a token from — the API
// routes skip verification entirely in that mode (see server/require-user.ts).
async function idToken(): Promise<string | undefined> {
  if (LOCAL_MODE) return undefined;
  return auth.currentUser?.getIdToken();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await idToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    if (!LOCAL_MODE) await auth.signOut().catch(() => {});
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data;
}

// PDF downloads don't go through the `{ data }` JSON envelope — this is a
// deliberate second path alongside `request()`, not a replacement for it.
async function requestBlob(path: string): Promise<Blob> {
  const token = await idToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    if (!LOCAL_MODE) await auth.signOut().catch(() => {});
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.blob();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  getBlob: (path: string) => requestBlob(path),
};
