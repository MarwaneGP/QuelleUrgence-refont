import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { analyzeSymptoms } from '@/lib/triage';
import { saveDossier, generateAccessCode } from '@/lib/dossier';
import { sendDossierEmail } from '@/lib/mailer';
import { getHospitalsWithAttendance } from '@/lib/hospitalService';
import { CreateDossierRequest, Dossier } from '@/types/triage';

export async function POST(request: Request) {
  try {
    const body: CreateDossierRequest = await request.json();

    if (!body.patient?.email) {
      return NextResponse.json({ error: 'Email patient manquant' }, { status: 400 });
    }

    const triageResult = await analyzeSymptoms(body);
    const hospitals = await getHospitalsWithAttendance(triageResult.recommendedSpecialties);

    const accessCode = generateAccessCode();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const qrCodeUrl = `${baseUrl}/dossier/${accessCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 300, margin: 2 });

    const dossier: Dossier = {
      id: accessCode,
      accessCode,
      createdAt: new Date().toISOString(),
      patient: body.patient,
      symptoms: body.symptoms,
      symptomDescription: body.symptomDescription,
      durationHours: body.durationHours,
      chronicConditions: body.chronicConditions,
      allergies: body.allergies,
      triage: triageResult,
      hospitals,
      qrCodeDataUrl,
      qrCodeUrl,
    };

    saveDossier(dossier);
    await sendDossierEmail(dossier);

    return NextResponse.json({
      success: true,
      accessCode,
      qrCodeDataUrl,
      message: `Dossier créé et envoyé à ${body.patient.email}`,
    });
  } catch (error) {
    console.error('Erreur API triage:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du dossier',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
