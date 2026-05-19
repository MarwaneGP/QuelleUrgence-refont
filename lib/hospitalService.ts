import fs from 'fs';
import path from 'path';
import { MockData, MockHospitalData } from '@/types/api';
import { HospitalRecommendation, Specialty } from '@/types/triage';
import type AttendanceData from '@/types/attendance';

const SPECIALTY_TO_MOCK_KEY: Record<string, (keyof MockHospitalData['professionnal'])[]> = {
  'cardiologie': ['cardiologist'],
  'neurologie': ['neurosurgeon'],
  'pneumologie': ['pulmonologist'],
  'gastro-entérologie': ['gasteroenterologist'],
  'orthopédie': ['orthopedist', 'orthopedic_surgeon'],
  'pédiatrie': ['pediatric_surgeon'],
  'gynécologie': ['gynecologist'],
  'urologie': ['urologist'],
  'dermatologie': ['dermatologist'],
  'psychiatrie': ['psychologist'],
  'rhumatologie': ['rheumatologist'],
  'endocrinologie': ['endocrinologist'],
  'néphrologie': ['nephrologist'],
  'ORL': ['ent'],
  'chirurgie générale': ['pediatric_surgeon', 'orthopedic_surgeon'],
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function currentTimeSlot(): keyof AttendanceData {
  return `timeSlot${new Date().getHours() + 1}` as keyof AttendanceData;
}

function getNumericValue(attendance: AttendanceData[], indicatorCode: string): number {
  const slot = currentTimeSlot();
  const entry = attendance.find(d => d.indicatorCode === indicatorCode);
  if (!entry) return 0;
  const v = entry[slot];
  return typeof v === 'number' && v > 0 ? v : 0;
}

function scoreSpecialties(mock: MockHospitalData, specialties: Specialty[]): number {
  return specialties.reduce((score, specialty) => {
    const keys = SPECIALTY_TO_MOCK_KEY[specialty] ?? [];
    return score + (keys.some(k => mock.professionnal[k]) ? 10 : 0);
  }, 0);
}

async function fetchAphpCodes(): Promise<Map<string, string>> {
  const apiUrl = process.env.APHP_HOSPITALS_API_URL;
  if (!apiUrl) return new Map();
  try {
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'QuelleUrgence/1.0' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return new Map();
    const list: { institutionName: string; institutionCode: string }[] = await res.json();
    return new Map(list.map(h => [normalizeName(h.institutionName), h.institutionCode]));
  } catch {
    return new Map();
  }
}

async function fetchAttendance(code: string): Promise<AttendanceData[] | null> {
  const apiBase = process.env.APHP_ATTENDANCE_API_BASE;
  if (!apiBase) return null;
  try {
    const res = await fetch(`${apiBase}/${code}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'QuelleUrgence/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function matchAphpCode(mockName: string, codeMap: Map<string, string>): string | null {
  const normalized = normalizeName(mockName);
  for (const [aphpName, code] of codeMap.entries()) {
    if (normalized.includes(aphpName) || aphpName.includes(normalized)) return code;
  }
  return null;
}

export async function getHospitalsWithAttendance(
  recommendedSpecialties: Specialty[]
): Promise<HospitalRecommendation[]> {
  const mockFilePath = path.join(process.cwd(), 'data', 'hospitalMock.json');
  let mockHospitals: MockHospitalData[] = [];

  try {
    const content = fs.readFileSync(mockFilePath, 'utf-8');
    const data: MockData = JSON.parse(content);
    mockHospitals = data.hospitals;
  } catch {
    return [];
  }

  const codeMap = await fetchAphpCodes();

  const scored = mockHospitals
    .map(mock => ({
      mock,
      aphpCode: matchAphpCode(mock.name, codeMap),
      specialtyScore: scoreSpecialties(mock, recommendedSpecialties),
    }))
    .sort((a, b) => b.specialtyScore - a.specialtyScore)
    .slice(0, 20);

  const attendanceResults = await Promise.all(
    scored.map(h => (h.aphpCode ? fetchAttendance(h.aphpCode) : Promise.resolve(null)))
  );

  const results = scored.map((h, i) => {
    const att = attendanceResults[i];
    const waitTime = att ? getNumericValue(att, 'DPS') || undefined : undefined;
    const totalPatients = att
      ? getNumericValue(att, 'PAM') + getNumericValue(att, 'PAI') + getNumericValue(att, 'DVI')
      : undefined;

    const specialties = Object.entries(h.mock.professionnal)
      .filter(([, v]) => v)
      .map(([k]) => k);

    return {
      name: h.mock.name,
      code: h.aphpCode ?? h.mock.place_id,
      distance: 0,
      waitTime,
      totalPatients,
      specialties,
      urgencyScore: h.specialtyScore,
    } satisfies HospitalRecommendation;
  });

  return results
    .sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore;
      const aP = a.totalPatients ?? 9999;
      const bP = b.totalPatients ?? 9999;
      if (aP !== bP) return aP - bP;
      return (a.waitTime ?? 9999) - (b.waitTime ?? 9999);
    })
    .slice(0, 10);
}
