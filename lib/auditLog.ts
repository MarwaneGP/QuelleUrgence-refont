import { getSupabaseAdmin } from './supabaseAdmin';
import {
  AuditAction,
  AuditLog,
  AuditLogFilters,
  AuditLogListResult,
} from '@/types/auditLog';

export interface LogActionInput {
  action: AuditAction;
  userId?: string | null;
  userEmail?: string | null;
  resource?: string | null;
  resourceId?: string | null;
  method?: string | null;
  statusCode?: number | null;
  path?: string | null;
  request?: Request | null;
  details?: Record<string, unknown>;
}

interface AuditLogRow {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  method: string | null;
  status_code: number | null;
  path: string | null;
  ip: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
}

function extractIp(request: Request | null | undefined): string | null {
  if (!request) return null;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

function extractPath(request: Request | null | undefined): string | null {
  if (!request) return null;
  try {
    return new URL(request.url).pathname;
  } catch {
    return null;
  }
}

function toPublic(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    userEmail: row.user_email,
    action: row.action,
    resource: row.resource,
    resourceId: row.resource_id,
    method: row.method,
    statusCode: row.status_code,
    path: row.path,
    ip: row.ip,
    userAgent: row.user_agent,
    details: row.details ?? {},
  };
}

/**
 * Inscrit un évènement dans la table `audit_logs`.
 * Ne lève jamais d'exception — l'audit ne doit pas casser l'appel métier.
 */
export async function logAction(input: LogActionInput): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    const req = input.request ?? null;

    await sb.from('audit_logs').insert({
      user_id: input.userId ?? null,
      user_email: input.userEmail ?? null,
      action: input.action,
      resource: input.resource ?? null,
      resource_id: input.resourceId ?? null,
      method: input.method ?? req?.method ?? null,
      status_code: input.statusCode ?? null,
      path: input.path ?? extractPath(req),
      ip: extractIp(req),
      user_agent: req?.headers.get('user-agent') ?? null,
      details: input.details ?? {},
    });
  } catch (err) {
    console.error('[auditLog] insertion échouée:', err);
  }
}

export async function listAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogListResult> {
  const sb = getSupabaseAdmin();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const offset = Math.max(filters.offset ?? 0, 0);

  let query = sb
    .from('audit_logs')
    .select(
      'id, created_at, user_id, user_email, action, resource, resource_id, method, status_code, path, ip, user_agent, details',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.action) query = query.eq('action', filters.action);
  if (filters.resource) query = query.eq('resource', filters.resource);
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.userEmail) query = query.ilike('user_email', `%${filters.userEmail}%`);
  if (filters.from) query = query.gte('created_at', filters.from);
  if (filters.to) query = query.lte('created_at', filters.to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    logs: (data ?? []).map(toPublic),
    total: count ?? 0,
  };
}
