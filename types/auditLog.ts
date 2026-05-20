export type AuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'operator.create'
  | 'operator.update'
  | 'operator.delete'
  | 'operator.list'
  | 'triage.create'
  | 'dossier.view'
  | 'dossier.search'
  | string;

export interface AuditLog {
  id: string;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  resource: string | null;
  resourceId: string | null;
  method: string | null;
  statusCode: number | null;
  path: string | null;
  ip: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
}

export interface AuditLogFilters {
  action?: string;
  resource?: string;
  userId?: string;
  userEmail?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogListResult {
  logs: AuditLog[];
  total: number;
}
