import { NextResponse } from 'next/server';
import { getDossier } from '@/lib/dossier';
import { logAction } from '@/lib/auditLog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
  }

  const dossier = getDossier(code);

  if (!dossier) {
    await logAction({
      action: 'dossier.view',
      resource: 'dossier',
      resourceId: code,
      statusCode: 404,
      request,
      details: { found: false },
    });
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
  }

  await logAction({
    action: 'dossier.view',
    resource: 'dossier',
    resourceId: code,
    statusCode: 200,
    request,
    details: { found: true, patientEmail: dossier.patient?.email ?? null },
  });

  return NextResponse.json(dossier);
}
