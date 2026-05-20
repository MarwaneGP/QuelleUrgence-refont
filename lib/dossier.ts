import fs from 'fs';
import path from 'path';
import { Dossier } from '@/types/triage';

const DOSSIERS_DIR = path.join(process.cwd(), 'data', 'dossiers');

function ensureDir() {
  if (!fs.existsSync(DOSSIERS_DIR)) {
    fs.mkdirSync(DOSSIERS_DIR, { recursive: true });
  }
}

export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `QU-${code}`;
}

export function saveDossier(dossier: Dossier): void {
  ensureDir();
  const filePath = path.join(DOSSIERS_DIR, `${dossier.accessCode}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dossier, null, 2), 'utf-8');
}

export function getDossier(accessCode: string): Dossier | null {
  ensureDir();
  const sanitized = accessCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const filePath = path.join(DOSSIERS_DIR, `${sanitized}.json`);

  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Dossier;
  } catch {
    return null;
  }
}

export function getAllDossiers(): Dossier[] {
  ensureDir();
  return fs.readdirSync(DOSSIERS_DIR)
    .filter(file => file.toLowerCase().endsWith('.json'))
    .map(file => {
      try {
        const raw = fs.readFileSync(path.join(DOSSIERS_DIR, file), 'utf-8');
        return JSON.parse(raw) as Dossier;
      } catch {
        return null;
      }
    })
    .filter((item): item is Dossier => item !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function dossierExists(accessCode: string): boolean {
  ensureDir();
  const sanitized = accessCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return fs.existsSync(path.join(DOSSIERS_DIR, `${sanitized}.json`));
}
