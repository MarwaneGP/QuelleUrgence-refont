import { NextResponse } from 'next/server';
import { createOperator } from '@/lib/operators';
import { logAction } from '@/lib/auditLog';
import { CreateOperatorInput } from '@/types/operator';

/**
 * POST /api/auth/signup
 * Endpoint public d'auto-inscription. Force role='operator' : un signup public ne peut
 * jamais créer un admin. La gestion des rôles passe par /api/operators (admin only).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateOperatorInput>;

    if (!body?.firstName || !body?.lastName || !body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Champs manquants (firstName, lastName, email, password requis)' },
        { status: 400 }
      );
    }

    const input: CreateOperatorInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      role: 'operator',
    };

    const result = await createOperator(input);

    if (result.errors) {
      await logAction({
        action: 'auth.signup',
        resource: 'auth',
        statusCode: 400,
        request,
        userEmail: input.email,
        details: { success: false, errors: result.errors },
      });
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    await logAction({
      action: 'auth.signup',
      resource: 'operator',
      resourceId: result.operator?.id ?? null,
      userId: result.operator?.id ?? null,
      userEmail: result.operator?.email ?? input.email,
      statusCode: 201,
      request,
      details: {
        success: true,
        firstName: result.operator?.firstName,
        lastName: result.operator?.lastName,
        role: result.operator?.role,
      },
    });

    return NextResponse.json({ operator: result.operator }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/auth/signup:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
