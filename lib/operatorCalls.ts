import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CreateOperatorCallInput, OperatorCall } from '@/types/operator';

const CALLS_DIR = path.join(process.cwd(), 'data', 'operator-calls');

export interface StoredOperatorCall extends OperatorCall {
  id: string;
  createdAt: string;
  updatedAt: string;
  hospitalLinkToken: string;
  hospitalLinkUrl: string;
}

function ensureDir() {
  if (!fs.existsSync(CALLS_DIR)) {
    fs.mkdirSync(CALLS_DIR, { recursive: true });
  }
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

function sanitizeToken(token: string): string {
  return token.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function generateHospitalLinkToken(): string {
  ensureDir();

  for (let i = 0; i < 10; i += 1) {
    const token = crypto.randomBytes(24).toString('base64url');
    if (!getOperatorCallByHospitalToken(token)) return token;
  }

  throw new Error('Impossible de generer un lien hopital unique');
}

export function saveOperatorCall(input: CreateOperatorCallInput): StoredOperatorCall {
  ensureDir();

  const now = new Date().toISOString();
  const id = `CALL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const hospitalLinkToken = generateHospitalLinkToken();
  const hospitalLinkUrl = `${getBaseUrl()}/hopitaux/lien/${hospitalLinkToken}`;

  const call: StoredOperatorCall = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
    hospitalLinkToken,
    hospitalLinkUrl,
  };

  fs.writeFileSync(path.join(CALLS_DIR, `${id}.json`), JSON.stringify(call, null, 2), 'utf-8');
  return call;
}

export function getOperatorCallByHospitalToken(token: string): StoredOperatorCall | null {
  ensureDir();
  const cleanToken = sanitizeToken(token);
  if (!cleanToken) return null;

  const files = fs.readdirSync(CALLS_DIR).filter(file => file.toLowerCase().endsWith('.json'));

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CALLS_DIR, file), 'utf-8');
      const call = JSON.parse(raw) as StoredOperatorCall;
      if (call.hospitalLinkToken === cleanToken) return call;
    } catch {
    }
  }

  return null;
}

export function listOperatorCalls(operatorId: string, limit = 50): StoredOperatorCall[] {
  ensureDir();

  return fs.readdirSync(CALLS_DIR)
    .filter(file => file.toLowerCase().endsWith('.json'))
    .map(file => {
      try {
        const raw = fs.readFileSync(path.join(CALLS_DIR, file), 'utf-8');
        return JSON.parse(raw) as StoredOperatorCall;
      } catch {
        return null;
      }
    })
    .filter((call): call is StoredOperatorCall => call !== null && call.operatorId === operatorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
