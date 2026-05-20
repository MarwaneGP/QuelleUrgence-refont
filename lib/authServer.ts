import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';
import { OperatorRole } from '@/types/operator';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: OperatorRole;
}

function extractBearer(request: Request): string | null {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

/**
 * Vérifie le token Bearer puis charge le rôle de l'opérateur en base.
 * Retourne null si la session est invalide ou si l'opérateur n'a pas de profil.
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<AuthenticatedUser | null> {
  const token = extractBearer(request);
  if (!token) return null;

  const sb = getSupabaseAdmin();
  const { data: userData, error: userError } = await sb.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const userId = userData.user.id;

  const { data: opData, error: opError } = await sb
    .from('operators')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (opError || !opData) return null;

  return {
    id: userId,
    email: userData.user.email ?? null,
    role: (opData.role as OperatorRole) ?? 'operator',
  };
}

/**
 * Garantit que l'appelant est authentifié. Retourne soit l'utilisateur,
 * soit une NextResponse 401 prête à être renvoyée.
 */
export async function requireAuth(
  request: Request
): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Session invalide ou expirée' },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Garantit que l'appelant est authentifié ET admin.
 * Retourne soit l'utilisateur, soit une NextResponse 401/403.
 */
export async function requireAdmin(
  request: Request
): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Session invalide ou expirée' },
      { status: 401 }
    );
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    );
  }
  return user;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
