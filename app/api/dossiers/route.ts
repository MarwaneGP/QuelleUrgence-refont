import { NextResponse } from 'next/server';
import { getAllDossiers } from '@/lib/dossier';
import { logAction } from '@/lib/auditLog';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone')?.trim() ?? '';
  const accessCode = url.searchParams.get('id')?.trim().toUpperCase() ?? '';

  const dossiers = getAllDossiers().filter(dossier => {
    if (phone && !dossier.patient.phone.toLowerCase().includes(phone.toLowerCase())) {
      return false;
    }
    if (accessCode && !dossier.accessCode.toUpperCase().includes(accessCode)) {
      return false;
    }
    return true;
  });

  await logAction({
    action: 'dossier.search',
    resource: 'dossier',
    statusCode: 200,
    request,
    details: {
      phoneQuery: phone || null,
      idQuery: accessCode || null,
      resultCount: dossiers.length,
    },
  });

  return NextResponse.json({ dossiers });
}
