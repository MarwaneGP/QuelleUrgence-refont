import { NextResponse } from 'next/server';
import { getAllDossiers } from '@/lib/dossier';

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

  return NextResponse.json({ dossiers });
}
