import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/authServer';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
