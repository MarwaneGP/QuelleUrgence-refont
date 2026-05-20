'use client';

import { getSupabaseBrowser } from './supabaseBrowser';

interface SignInResult {
  success: boolean;
  error?: string;
}

async function postAuthEvent(
  action: 'auth.login' | 'auth.login_failed' | 'auth.logout',
  payload: {
    userId?: string | null;
    userEmail?: string | null;
    accessToken?: string | null;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.accessToken) {
      headers.Authorization = `Bearer ${payload.accessToken}`;
    }
    await fetch('/api/auth/event', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        userId: payload.userId ?? null,
        userEmail: payload.userEmail ?? null,
        details: payload.details ?? {},
      }),
      keepalive: true,
    });
  } catch (err) {
    console.error('[authClient] /api/auth/event échec:', err);
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInResult> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    await postAuthEvent('auth.login_failed', {
      userEmail: email,
      details: { reason: error?.message ?? 'unknown' },
    });
    return { success: false, error: error?.message ?? 'Identifiants invalides' };
  }

  await postAuthEvent('auth.login', {
    userId: data.user.id,
    userEmail: data.user.email ?? email,
    accessToken: data.session?.access_token ?? null,
  });
  return { success: true };
}

export async function signOut(): Promise<void> {
  const sb = getSupabaseBrowser();
  const { data } = await sb.auth.getSession();
  const session = data.session;

  // Log AVANT le signOut pour avoir encore les infos utilisateur.
  await postAuthEvent('auth.logout', {
    userId: session?.user?.id ?? null,
    userEmail: session?.user?.email ?? null,
    accessToken: session?.access_token ?? null,
  });

  await sb.auth.signOut();
}

export async function getCurrentUser() {
  const sb = getSupabaseBrowser();
  const { data } = await sb.auth.getUser();
  return data.user;
}
