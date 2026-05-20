import { NextResponse } from 'next/server';
import { getAphpHospitalsWithAttendance } from '@/lib/aphpHospitalsService';

export async function GET() {
  try {
    const hospitals = await getAphpHospitalsWithAttendance();
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        count: hospitals.length,
        hospitals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/hospitals/aphp-live:', error);
    return NextResponse.json(
      {
        error: 'Failed to load AP-HP hospitals with attendance',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
