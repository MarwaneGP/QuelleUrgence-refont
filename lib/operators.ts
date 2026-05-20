import { getSupabaseAdmin } from './supabaseAdmin';
import {
  OperatorPublic,
  OperatorRole,
  CreateOperatorInput,
  UpdateOperatorInput,
} from '@/types/operator';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: OperatorRole[] = ['operator', 'admin'];

export interface ValidationError {
  field: string;
  message: string;
}

interface OperatorRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: OperatorRole | null;
  created_at: string;
  updated_at: string;
}

function toPublic(row: OperatorRow): OperatorPublic {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role ?? 'operator',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isDuplicateEmailError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('already') || m.includes('duplicate') || m.includes('registered');
}

function isUserNotFoundError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('not found') || m.includes('user not');
}

export async function listOperators(): Promise<OperatorPublic[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('operators_with_email')
    .select('id, first_name, last_name, email, role, created_at, updated_at')
    .order('last_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPublic);
}

export async function getOperator(id: string): Promise<OperatorPublic | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('operators_with_email')
    .select('id, first_name, last_name, email, role, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPublic(data) : null;
}

function validateCreate(input: CreateOperatorInput): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!input.firstName?.trim()) errors.push({ field: 'firstName', message: 'Prénom requis' });
  if (!input.lastName?.trim()) errors.push({ field: 'lastName', message: 'Nom requis' });
  if (!input.email?.trim()) errors.push({ field: 'email', message: 'Email requis' });
  else if (!EMAIL_REGEX.test(input.email.trim())) errors.push({ field: 'email', message: 'Email invalide' });
  if (!input.password) errors.push({ field: 'password', message: 'Mot de passe requis' });
  else if (input.password.length < 8) errors.push({ field: 'password', message: 'Mot de passe trop court (min 8 caractères)' });
  if (input.role !== undefined && !VALID_ROLES.includes(input.role)) {
    errors.push({ field: 'role', message: 'Rôle invalide' });
  }
  return errors;
}

export async function createOperator(
  input: CreateOperatorInput
): Promise<{ operator?: OperatorPublic; errors?: ValidationError[] }> {
  const errors = validateCreate(input);
  if (errors.length) return { errors };

  const sb = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    const msg = authError?.message ?? 'Erreur lors de la création du compte';
    if (isDuplicateEmailError(msg)) {
      return { errors: [{ field: 'email', message: 'Un opérateur avec cet email existe déjà' }] };
    }
    return { errors: [{ field: 'email', message: msg }] };
  }

  const userId = authData.user.id;
  const { error: insertError } = await sb.from('operators').insert({
    id: userId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    role: input.role ?? 'operator',
  });

  if (insertError) {
    await sb.auth.admin.deleteUser(userId);
    return { errors: [{ field: 'firstName', message: insertError.message }] };
  }

  const operator = await getOperator(userId);
  if (!operator) {
    return { errors: [{ field: 'id', message: 'Opérateur créé mais introuvable' }] };
  }
  return { operator };
}

export async function updateOperator(
  id: string,
  input: UpdateOperatorInput
): Promise<{ operator?: OperatorPublic; errors?: ValidationError[] }> {
  const errors: ValidationError[] = [];
  if (input.firstName !== undefined && !input.firstName.trim())
    errors.push({ field: 'firstName', message: 'Prénom requis' });
  if (input.lastName !== undefined && !input.lastName.trim())
    errors.push({ field: 'lastName', message: 'Nom requis' });
  if (input.email !== undefined) {
    if (!input.email.trim()) errors.push({ field: 'email', message: 'Email requis' });
    else if (!EMAIL_REGEX.test(input.email.trim())) errors.push({ field: 'email', message: 'Email invalide' });
  }
  if (input.password !== undefined && input.password.length < 8) {
    errors.push({ field: 'password', message: 'Mot de passe trop court (min 8 caractères)' });
  }
  if (input.role !== undefined && !VALID_ROLES.includes(input.role)) {
    errors.push({ field: 'role', message: 'Rôle invalide' });
  }
  if (errors.length) return { errors };

  const sb = getSupabaseAdmin();

  const authPayload: { email?: string; password?: string } = {};
  if (input.email) authPayload.email = input.email.trim().toLowerCase();
  if (input.password) authPayload.password = input.password;

  if (Object.keys(authPayload).length > 0) {
    const { error: authError } = await sb.auth.admin.updateUserById(id, authPayload);
    if (authError) {
      if (isUserNotFoundError(authError.message)) {
        return { errors: [{ field: 'id', message: 'Opérateur introuvable' }] };
      }
      if (isDuplicateEmailError(authError.message)) {
        return { errors: [{ field: 'email', message: 'Un opérateur avec cet email existe déjà' }] };
      }
      return { errors: [{ field: 'email', message: authError.message }] };
    }
  }

  const opPayload: { first_name?: string; last_name?: string; role?: OperatorRole } = {};
  if (input.firstName !== undefined) opPayload.first_name = input.firstName.trim();
  if (input.lastName !== undefined) opPayload.last_name = input.lastName.trim();
  if (input.role !== undefined) opPayload.role = input.role;

  if (Object.keys(opPayload).length > 0) {
    const { error: opError } = await sb.from('operators').update(opPayload).eq('id', id);
    if (opError) return { errors: [{ field: 'firstName', message: opError.message }] };
  }

  const operator = await getOperator(id);
  if (!operator) return { errors: [{ field: 'id', message: 'Opérateur introuvable' }] };
  return { operator };
}

export async function deleteOperator(id: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.auth.admin.deleteUser(id);
  return !error;
}
