import { NextResponse } from 'next/server';
import { getDossier } from '@/lib/dossier';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
  }

  const dossier = getDossier(code);

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
  }

  return NextResponse.json(dossier);
}
