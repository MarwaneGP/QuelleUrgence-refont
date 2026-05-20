import { NextResponse } from 'next/server';
import { logAction } from '@/lib/auditLog';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { AuditAction } from '@/types/auditLog';

interface AuthEventBody {
  action: AuditAction;
  userId?: string | null;
  userEmail?: string | null;
  details?: Record<string, unknown>;
}

const ALLOWED_ACTIONS = new Set<AuditAction>([
  'auth.login',
  'auth.login_failed',
  'auth.logout',
]);

function extractBearer(request: Request): string | null {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuthEventBody;
    if (!body?.action || !ALLOWED_ACTIONS.has(body.action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    let verifiedUserId: string | null = null;
    let verifiedUserEmail: string | null = null;
    const token = extractBearer(request);
    if (token) {
      try {
        const sb = getSupabaseAdmin();
        const { data, error } = await sb.auth.getUser(token);
        if (!error && data?.user) {
          verifiedUserId = data.user.id;
          verifiedUserEmail = data.user.email ?? null;
        }
      } catch (err) {
        console.error('[/api/auth/event] verification token échouée:', err);
      }
    }

    await logAction({
      action: body.action,
      resource: 'auth',
      userId: verifiedUserId ?? body.userId ?? null,
      userEmail: verifiedUserEmail ?? body.userEmail ?? null,
      statusCode: 200,
      request,
      details: {
        ...(body.details ?? {}),
        tokenVerified: Boolean(verifiedUserId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur POST /api/auth/event:', error);
    return NextResponse.json({ error: 'Erreur d\'audit' }, { status: 500 });
  }
}
