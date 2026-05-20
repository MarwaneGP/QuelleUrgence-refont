import type { AphpHospitalWithAttendance } from '@/lib/aphpHospitalsService';
import type { StoredOperatorCall } from '@/lib/operatorCalls';

export interface RankedHospital extends AphpHospitalWithAttendance {
  distanceKm: number | null;
  recommendationScore: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const SERVICE_TO_CAPABILITIES: Record<string, Array<keyof AphpHospitalWithAttendance['capabilities']>> = {
  'urgences generales': ['emergency'],
  'cardiologie': ['cardiology', 'cardiacEmergency'],
  'neurologie': ['neurology', 'stroke'],
  'traumatologie': ['emergency'],
  'pediatrie': ['emergency'],
  'gynecologie obstetrique': ['emergency'],
  'toxicologie': ['emergency'],
  'pneumologie': ['emergency'],
  'gastro enterologie': ['emergency'],
  'chirurgie generale': ['emergency'],
};

const FALLBACK_CAPABILITIES_BY_CODE: Record<string, Array<keyof AphpHospitalWithAttendance['capabilities']>> = {
  LRB: ['emergency'],
  SLS: ['emergency', 'cardiology'],
  PSL: ['emergency', 'cardiology', 'neurology', 'stroke'],
  BCH: ['emergency', 'cardiology'],
  CCN: ['emergency', 'cardiology'],
  HTD: ['emergency'],
  TNN: ['emergency', 'cardiology', 'neurology'],
  APR: ['emergency'],
  HMN: ['emergency', 'cardiology', 'neurology', 'stroke'],
  AVC: ['emergency'],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toRadians(value: number): number {
  return value * Math.PI / 180;
}

function distanceKm(from: Coordinates, hospital: AphpHospitalWithAttendance): number | null {
  if (hospital.latitude == null || hospital.longitude == null) return null;

  const earthRadiusKm = 6371;
  const dLat = toRadians(hospital.latitude - from.latitude);
  const dLon = toRadians(hospital.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(hospital.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function selectedCapabilities(services: string[]): Set<keyof AphpHospitalWithAttendance['capabilities']> {
  const selected = new Set<keyof AphpHospitalWithAttendance['capabilities']>();

  for (const service of services) {
    const capabilities = SERVICE_TO_CAPABILITIES[normalize(service)] ?? [];
    for (const capability of capabilities) selected.add(capability);
  }

  if (selected.size === 0) selected.add('emergency');
  return selected;
}

function serviceScore(hospital: AphpHospitalWithAttendance, selected: Set<keyof AphpHospitalWithAttendance['capabilities']>): number {
  let matches = 0;
  const fallbackCapabilities = new Set(FALLBACK_CAPABILITIES_BY_CODE[hospital.code] ?? []);

  for (const capability of selected) {
    if (hospital.capabilities?.[capability] || fallbackCapabilities.has(capability)) matches += 1;
  }
  return matches / selected.size;
}

function attendanceScore(hospital: AphpHospitalWithAttendance): number {
  const wait = hospital.attendance?.DPS;
  const patients = hospital.attendance?.PAM;

  const waitScore = typeof wait === 'number' ? Math.max(0, 1 - wait / 180) : 0.55;
  const patientScore = typeof patients === 'number' ? Math.max(0, 1 - patients / 80) : 0.55;

  return (waitScore * 0.65) + (patientScore * 0.35);
}

function cityScore(call: StoredOperatorCall, hospital: AphpHospitalWithAttendance): number {
  const city = normalize(call.location.ville);
  if (!city || !hospital.city) return 0;
  return normalize(hospital.city).includes(city) || city.includes(normalize(hospital.city)) ? 1 : 0;
}

function distanceScore(distance: number | null, sameCityScore: number): number {
  if (distance == null) return sameCityScore > 0 ? 0.8 : 0.45;
  if (distance <= 2) return 1;
  if (distance <= 10) return 1 - ((distance - 2) / 8) * 0.35;
  if (distance <= 30) return 0.65 - ((distance - 10) / 20) * 0.45;
  return 0.15;
}

export async function geocodeOperatorCallLocation(call: StoredOperatorCall): Promise<Coordinates | null> {
  const address = [
    call.location.adresse_rue_et_num,
    call.location.adresse_complements,
    call.location.ville,
  ]
    .filter(Boolean)
    .join(', ');

  if (!address.trim()) return null;

  try {
    const url = `https://api-adresse.data.gouv.fr/search/?limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'QuelleUrgence/1.0' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = await res.json() as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };
    const coordinates = data.features?.[0]?.geometry?.coordinates;
    if (!coordinates) return null;

    return { latitude: coordinates[1], longitude: coordinates[0] };
  } catch {
    return null;
  }
}

export function rankHospitalsForOperatorCall(
  hospitals: AphpHospitalWithAttendance[],
  call: StoredOperatorCall,
  coordinates: Coordinates | null
): RankedHospital[] {
  const capabilities = selectedCapabilities(call.event.service_concerne_hopital);

  const ranked = hospitals
    .map((hospital) => {
      const sameCityScore = cityScore(call, hospital);
      const dist = coordinates ? distanceKm(coordinates, hospital) : null;
      const score =
        serviceScore(hospital, capabilities) * 45 +
        distanceScore(dist, sameCityScore) * 35 +
        attendanceScore(hospital) * 20;

      return {
        ...hospital,
        distanceKm: dist,
        recommendationScore: Math.round(score),
      };
    })
    .filter((hospital) => {
      const hasRequestedService = serviceScore(hospital, capabilities) > 0;
      const isNearEnough = hospital.distanceKm == null || hospital.distanceKm <= 50;
      return hasRequestedService && isNearEnough;
    })
    .sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (distanceA !== distanceB) return distanceA - distanceB;
      return (a.attendance?.DPS ?? 9999) - (b.attendance?.DPS ?? 9999);
    });

  if (ranked.length > 0) return ranked;

  return hospitals
    .map((hospital) => {
      const sameCityScore = cityScore(call, hospital);
      const dist = coordinates ? distanceKm(coordinates, hospital) : null;
      const score =
        distanceScore(dist, sameCityScore) * 55 +
        attendanceScore(hospital) * 35 +
        (hospital.capabilities?.emergency ? 10 : 0);

      return {
        ...hospital,
        distanceKm: dist,
        recommendationScore: Math.round(score),
      };
    })
    .filter((hospital) => hospital.distanceKm == null || hospital.distanceKm <= 50)
    .sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return distanceA - distanceB;
    });
}
