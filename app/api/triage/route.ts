import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { analyzeSymptoms } from '@/lib/triage';
import { saveDossier, generateAccessCode } from '@/lib/dossier';
import { sendDossierEmail } from '@/lib/mailer';
import { getHospitalsWithAttendance } from '@/lib/hospitalService';
import { logAction } from '@/lib/auditLog';
import { CreateDossierRequest, Dossier } from '@/types/triage';

export async function POST(request: Request) {
  try {
    const body: CreateDossierRequest = await request.json();

    if (!body.patient?.email) {
      await logAction({
        action: 'triage.create',
        resource: 'dossier',
        statusCode: 400,
        request,
        details: { success: false, reason: 'missing_email' },
      });
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

    await logAction({
      action: 'triage.create',
      resource: 'dossier',
      resourceId: accessCode,
      userEmail: body.patient.email,
      statusCode: 201,
      request,
      details: {
        success: true,
        patientEmail: body.patient.email,
        symptomsCount: Array.isArray(body.symptoms) ? body.symptoms.length : null,
        urgencyLevel: triageResult?.urgencyLevel ?? null,
        urgencyLabel: triageResult?.urgencyLabel ?? null,
        durationHours: body.durationHours ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      accessCode,
      qrCodeDataUrl,
      message: `Dossier créé et envoyé à ${body.patient.email}`,
    });
  } catch (error) {
    console.error('Erreur API triage:', error);
    await logAction({
      action: 'triage.create',
      resource: 'dossier',
      statusCode: 500,
      request,
      details: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du dossier',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
