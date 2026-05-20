import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/auditLog';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action')?.trim() || undefined;
    const resource = url.searchParams.get('resource')?.trim() || undefined;
    const userId = url.searchParams.get('userId')?.trim() || undefined;
    const userEmail = url.searchParams.get('userEmail')?.trim() || undefined;
    const from = url.searchParams.get('from')?.trim() || undefined;
    const to = url.searchParams.get('to')?.trim() || undefined;
    const limitRaw = url.searchParams.get('limit');
    const offsetRaw = url.searchParams.get('offset');

    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 100;
    const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;

    const result = await listAuditLogs({
      action,
      resource,
      userId,
      userEmail,
      from,
      to,
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur GET /api/admin/logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}
