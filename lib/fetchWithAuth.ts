'use client';

import { getSupabaseBrowser } from './supabaseBrowser';

/**
 * Wrapper autour de `fetch` qui ajoute automatiquement le bearer token Supabase
 * de la session courante dans l'en-tête `Authorization`.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const sb = getSupabaseBrowser();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers ?? {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
