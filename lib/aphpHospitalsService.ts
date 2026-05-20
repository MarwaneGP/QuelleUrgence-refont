import type AttendanceData from '@/types/attendance';

interface AphpSiteConfig {
  code: string;
  label: string;
  aliases: string[];
}

interface ParsedFinessRow {
  finessEt: string;
  finessGeo: string;
  rs: string;
  rslongue: string;
  numvoie: string;
  typvoie: string;
  voie: string;
  compvoie: string;
  lieuditbp: string;
  departement: string;
  ligneacheminement: string;
  categetab: string;
  telephone: string;
  latitude: number | null;
  longitude: number | null;
}

interface AphpAttendanceSnapshot {
  PAM: number | null;
  DVI: number | null;
  DVM: number | null;
  DPS: number | null;
  PSS: number | null;
}

interface HospitalCapabilities {
  emergency: boolean;
  cardiology: boolean;
  neurology: boolean;
  cardiacEmergency: boolean;
  stroke: boolean;
  imaging: boolean;
  crowded: boolean;
}

interface AphpHospitalWithAttendance {
  id: string | null;
  code: string;
  name: string;
  sourceName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance: AphpAttendanceSnapshot | null;
  attendanceRawCount: number;
  services: string[];
  equipment: string[];
  capabilities: HospitalCapabilities;
}

interface DataGouvResource {
  title?: string;
  format?: string;
  url?: string;
  filetype?: string;
  type?: string;
  last_modified?: string;
}

interface DataGouvDataset {
  slug?: string;
  resources?: DataGouvResource[];
}

const APHP_SITES: AphpSiteConfig[] = [
  { code: 'LRB', label: 'Hopital Lariboisiere', aliases: ['lariboisiere', 'fernand widal'] },
  { code: 'SLS', label: 'Hopital Saint-Louis', aliases: ['saint louis'] },
  { code: 'PSL', label: 'Hopital Pitie-Salpetriere', aliases: ['pitie salpetriere', 'salpetriere', 'pitie'] },
  { code: 'BCH', label: 'Hopital Bichat', aliases: ['bichat'] },
  { code: 'CCN', label: 'Hopital Cochin', aliases: ['cochin'] },
  { code: 'HTD', label: 'Hopital Hotel-Dieu', aliases: ['hotel dieu'] },
  { code: 'TNN', label: 'Hopital Tenon', aliases: ['tenon'] },
  { code: 'APR', label: 'Hopital Ambroise-Pare', aliases: ['ambroise pare'] },
  { code: 'HMN', label: 'Hopital Henri-Mondor', aliases: ['henri mondor'] },
  { code: 'AVC', label: 'Hopital Avicenne', aliases: ['avicenne'] },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ';' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  result.push(current);
  return result;
}

function parseLatitudeLongitude(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseLineAcheminement(value: string): { postalCode: string | null; city: string | null } {
  const clean = value.trim();
  if (!clean) return { postalCode: null, city: null };

  const match = clean.match(/^(\d{5})\s+(.+)$/);
  if (!match) return { postalCode: null, city: clean };

  return { postalCode: match[1], city: match[2] };
}

function buildAddress(row: ParsedFinessRow): string | null {
  const parts = [row.numvoie, row.typvoie, row.voie, row.compvoie, row.lieuditbp]
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function currentTimeSlotKey(): keyof AttendanceData {
  return `timeSlot${new Date().getHours() + 1}` as keyof AttendanceData;
}

function attendanceToSnapshot(entries: AttendanceData[]): AphpAttendanceSnapshot | null {
  if (!entries.length) return null;

  const slotKey = currentTimeSlotKey();
  const getValue = (indicatorCode: string): number | null => {
    const row = entries.find((item) => item.indicatorCode === indicatorCode);
    const value = row?.[slotKey];
    return typeof value === 'number' ? value : null;
  };

  return {
    PAM: getValue('PAM'),
    DVI: getValue('DVI'),
    DVM: getValue('DVM'),
    DPS: getValue('DPS'),
    PSS: getValue('PSS'),
  };
}

function parseFinessRows(csv: string): ParsedFinessRow[] {
  const lines = csv.split(/\r?\n/);
  const rows: ParsedFinessRow[] = [];

  for (const line of lines) {
    if (!line || !line.startsWith('structureet;')) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 19) continue;

    rows.push({
      finessEt: cols[1] ?? '',
      finessGeo: cols[2] ?? '',
      rs: cols[3] ?? '',
      rslongue: cols[4] ?? '',
      numvoie: cols[7] ?? '',
      typvoie: cols[8] ?? '',
      voie: cols[9] ?? '',
      compvoie: cols[10] ?? '',
      lieuditbp: cols[11] ?? '',
      departement: cols[13] ?? '',
      ligneacheminement: cols[15] ?? '',
      telephone: cols[16] ?? '',
      categetab: cols[18] ?? '',
      latitude: parseLatitudeLongitude(cols[31]),
      longitude: parseLatitudeLongitude(cols[32]),
    });
  }

  return rows;
}

function pickBestSiteRows(rows: ParsedFinessRow[]): Map<string, ParsedFinessRow> {
  const selected = new Map<string, ParsedFinessRow>();
  const scores = new Map<string, number>();

  for (const row of rows) {
    const normalizedName = normalizeText(`${row.rs} ${row.rslongue}`);
    const hasAphpMarker = /\baphp\b|assistance publique|ghu ap/.test(normalizedName);
    const isIdfDepartment = ['75', '92', '93', '94'].includes(row.departement);
    if (!hasAphpMarker && !isIdfDepartment) continue;

    for (const site of APHP_SITES) {
      const aliasMatch = site.aliases.some((alias) => normalizedName.includes(normalizeText(alias)));
      if (!aliasMatch) continue;

      let score = 0;
      if (hasAphpMarker) score += 5;
      if (isIdfDepartment) score += 2;
      if (['101', '355'].includes(row.categetab)) score += 2;
      if (normalizedName.includes('site')) score += 1;
      if (normalizedName.includes(normalizeText(site.label))) score += 1;

      const prevScore = scores.get(site.code) ?? Number.NEGATIVE_INFINITY;
      if (score > prevScore) {
        scores.set(site.code, score);
        selected.set(site.code, row);
      }
    }
  }

  return selected;
}

async function fetchAttendanceForCode(code: string): Promise<AttendanceData[]> {
  const apiBase = process.env.APHP_ATTENDANCE_API_BASE;
  if (!apiBase) return [];

  try {
    const response = await fetch(`${apiBase}/${code}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'QuelleUrgence/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return [];
    const data = (await response.json()) as AttendanceData[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function toDatasetApiUrl(inputUrl: string): string | null {
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  if (/\/api\/1\/datasets\/[^/]+\/?$/i.test(trimmed)) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  const m = trimmed.match(/https?:\/\/www\.data\.gouv\.fr\/(?:fr\/)?datasets\/([^/?#]+)/i);
  if (m) {
    return `https://www.data.gouv.fr/api/1/datasets/${m[1]}/`;
  }

  return null;
}

function scoreCsvResource(resource: DataGouvResource): number {
  const format = (resource.format ?? '').toLowerCase();
  const filetype = (resource.filetype ?? '').toLowerCase();
  const type = (resource.type ?? '').toLowerCase();
  const url = resource.url ?? '';

  if (format !== 'csv') return Number.NEGATIVE_INFINITY;

  let score = 0;
  if (filetype === 'file') score += 6;
  if (type === 'main') score += 4;
  if (/\.csv($|\?)/i.test(url)) score += 3;
  if (/^https:\/\/static\.data\.gouv\.fr\//i.test(url)) score += 2;

  const lastModified = Date.parse(resource.last_modified ?? '');
  if (Number.isFinite(lastModified)) score += lastModified / 1e13;

  return score;
}

async function fetchDatasetResources(datasetUrl: string): Promise<DataGouvResource[]> {
  const apiUrl = toDatasetApiUrl(datasetUrl);
  if (!apiUrl) return [];

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'QuelleUrgence/1.0' },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];
    const data = (await res.json()) as DataGouvDataset;
    return Array.isArray(data.resources) ? data.resources : [];
  } catch {
    return [];
  }
}

async function resolveCsvUrl(datasetOrCsvUrl: string | undefined): Promise<string | null> {
  const value = datasetOrCsvUrl?.trim();
  if (!value) return null;

  if (/\/api\/1\/datasets\/r\//i.test(value) || /\.csv($|\?)/i.test(value)) {
    return value;
  }

  const resources = await fetchDatasetResources(value);
  const best = resources
    .map((resource) => ({ resource, score: scoreCsvResource(resource) }))
    .sort((a, b) => b.score - a.score)[0];

  return best && Number.isFinite(best.score) && best.score > Number.NEGATIVE_INFINITY
    ? (best.resource.url ?? null)
    : null;
}

async function findSaeCsvFallbackUrl(): Promise<string | null> {
  try {
    const queryUrl = 'https://www.data.gouv.fr/api/1/datasets/?q=bases%20administratives%20sae&page_size=5';
    const res = await fetch(queryUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'QuelleUrgence/1.0' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { data?: Array<{ resources?: DataGouvResource[] }> };
    const datasets = body.data ?? [];

    const candidates = datasets.flatMap((d) => d.resources ?? [])
      .map((resource) => ({ resource, score: scoreCsvResource(resource) }))
      .filter((x) => Number.isFinite(x.score) && x.score > Number.NEGATIVE_INFINITY)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.resource.url ?? null;
  } catch {
    return null;
  }
}

function normalizeEquipment(equipmentCode: string, equipmentLabel: string): string {
  const code = equipmentCode.trim();
  const label = normalizeText(equipmentLabel);

  if (code === '04101' || label.includes('irm')) return 'mri';
  if (code === '05602' || label.includes('tomodensitometr') || label.includes('scanner') || label.includes('scanographe')) return 'ct_scan';
  if (code === '05705' || label.includes('tomographe a emissions') || label.includes('tep')) return 'pet_scan';
  if (code === '05701' || label.includes('camera a scintillation')) return 'nuclear_camera';
  if (label.includes('cyclotron')) return 'cyclotron';

  return `equipment_${code || label.replace(/\s+/g, '_')}`;
}

function parseEquipmentCsvByFiness(csv: string): Map<string, Set<string>> {
  const rows = csv.split(/\r?\n/);
  const byFiness = new Map<string, Set<string>>();

  for (const line of rows) {
    if (!line.startsWith('equipmateriellourd;')) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 11) continue;

    const equipmentCode = cols[3] ?? '';
    const equipmentLabel = cols[4] ?? '';
    const finessEt = (cols[9] ?? '').trim();
    if (!/^\d{9}$/.test(finessEt)) continue;

    const normalized = normalizeEquipment(equipmentCode, equipmentLabel);
    if (!byFiness.has(finessEt)) byFiness.set(finessEt, new Set<string>());
    byFiness.get(finessEt)!.add(normalized);
  }

  return byFiness;
}

function normalizeServiceTags(rawLine: string): Set<string> {
  const tags = new Set<string>();
  const text = normalizeText(rawLine);

  if (/\burgenc\b|\bsau\b|\bsmur\b/.test(text)) tags.add('emergency');
  if (/cardiolog|coronar/.test(text)) tags.add('cardiology');
  if (/neurolog|neuro vasc|avc/.test(text)) tags.add('neurology');
  if (/pediatr/.test(text)) tags.add('pediatrics');

  return tags;
}

function parseServicesCsvByFiness(csv: string): Map<string, Set<string>> {
  const byFiness = new Map<string, Set<string>>();
  const rows = csv.split(/\r?\n/);

  for (const line of rows) {
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 2) continue;

    const finessEt = cols.find((cell) => /^\d{9}$/.test((cell ?? '').trim()))?.trim();
    if (!finessEt) continue;

    const serviceTags = normalizeServiceTags(line);
    if (serviceTags.size === 0) continue;

    if (!byFiness.has(finessEt)) byFiness.set(finessEt, new Set<string>());
    const bag = byFiness.get(finessEt)!;
    for (const tag of serviceTags) bag.add(tag);
  }

  return byFiness;
}

function inferCapabilities(input: {
  services: string[];
  equipment: string[];
  attendance: AphpAttendanceSnapshot | null;
}): HospitalCapabilities {
  const services = new Set(input.services);
  const equipment = new Set(input.equipment);
  const pam = input.attendance?.PAM ?? null;
  const dvi = input.attendance?.DVI ?? null;

  const emergency = services.has('emergency');
  const cardiology = services.has('cardiology');
  const neurology = services.has('neurology');
  const hasImaging = equipment.has('ct_scan') || equipment.has('mri') || equipment.has('pet_scan') || equipment.has('nuclear_camera');

  return {
    emergency,
    cardiology,
    neurology,
    cardiacEmergency: emergency && cardiology,
    stroke: neurology && (equipment.has('ct_scan') || equipment.has('mri')),
    imaging: hasImaging,
    crowded: (typeof pam === 'number' && pam > 40) || (typeof dvi === 'number' && dvi > 15),
  };
}

export async function getAphpHospitalsWithAttendance(): Promise<AphpHospitalWithAttendance[]> {
  const hospitalsCsvUrl = process.env.HOSPITALS_CSV_URL;
  if (!hospitalsCsvUrl) {
    throw new Error('Missing HOSPITALS_CSV_URL in environment variables');
  }

  const equipmentCsvUrl = await resolveCsvUrl(process.env.EML_CSV_URL || process.env.EML_DATASET_URL);

  let servicesCsvUrl = await resolveCsvUrl(process.env.SAE_CSV_URL || process.env.SAE_DATASET_URL);
  if (!servicesCsvUrl) {
    servicesCsvUrl = await findSaeCsvFallbackUrl();
  }

  const hospitalsCsvRes = await fetch(hospitalsCsvUrl, {
    headers: { Accept: 'text/csv,*/*;q=0.8', 'User-Agent': 'QuelleUrgence/1.0' },
    next: { revalidate: 86400 },
  });

  if (!hospitalsCsvRes.ok) {
    throw new Error(`Failed to fetch hospitals CSV: ${hospitalsCsvRes.status} ${hospitalsCsvRes.statusText}`);
  }

  const hospitalsCsvText = await hospitalsCsvRes.text();
  const parsedRows = parseFinessRows(hospitalsCsvText);
  const bestRowsByCode = pickBestSiteRows(parsedRows);

  const [equipmentByFiness, servicesByFiness, attendanceByCode] = await Promise.all([
    (async () => {
      if (!equipmentCsvUrl) return new Map<string, Set<string>>();
      try {
        const res = await fetch(equipmentCsvUrl, {
          headers: { Accept: 'text/csv,*/*;q=0.8', 'User-Agent': 'QuelleUrgence/1.0' },
          next: { revalidate: 86400 },
        });
        if (!res.ok) return new Map<string, Set<string>>();
        const text = await res.text();
        return parseEquipmentCsvByFiness(text);
      } catch {
        return new Map<string, Set<string>>();
      }
    })(),
    (async () => {
      if (!servicesCsvUrl) return new Map<string, Set<string>>();
      try {
        const res = await fetch(servicesCsvUrl, {
          headers: { Accept: 'text/csv,*/*;q=0.8', 'User-Agent': 'QuelleUrgence/1.0' },
          next: { revalidate: 86400 },
        });
        if (!res.ok) return new Map<string, Set<string>>();
        const text = await res.text();
        return parseServicesCsvByFiness(text);
      } catch {
        return new Map<string, Set<string>>();
      }
    })(),
    Promise.all(APHP_SITES.map(async (site) => [site.code, await fetchAttendanceForCode(site.code)] as const)),
  ]);

  const attendanceMap = new Map<string, AttendanceData[]>(attendanceByCode);

  return APHP_SITES.map((site) => {
    const row = bestRowsByCode.get(site.code);
    const attendanceRaw = attendanceMap.get(site.code) ?? [];
    const attendance = attendanceToSnapshot(attendanceRaw);
    const { city, postalCode } = parseLineAcheminement(row?.ligneacheminement ?? '');

    const finessEt = row?.finessEt ?? null;
    const equipment = finessEt ? Array.from(equipmentByFiness.get(finessEt) ?? []) : [];
    const servicesSet = new Set<string>(finessEt ? Array.from(servicesByFiness.get(finessEt) ?? []) : []);
    if (attendanceRaw.length > 0) {
      servicesSet.add('emergency');
    }
    const services = Array.from(servicesSet);

    return {
      id: finessEt,
      code: site.code,
      name: site.label,
      sourceName: row ? `${row.rs} ${row.rslongue}`.trim() : null,
      phone: row?.telephone?.trim() || null,
      address: row ? buildAddress(row) : null,
      city,
      postalCode,
      latitude: row?.latitude ?? null,
      longitude: row?.longitude ?? null,
      attendance,
      attendanceRawCount: attendanceRaw.length,
      services,
      equipment,
      capabilities: inferCapabilities({ services, equipment, attendance }),
    };
  });
}

export type { AphpHospitalWithAttendance, AphpAttendanceSnapshot, HospitalCapabilities };
