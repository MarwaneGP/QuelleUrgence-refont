import { NextResponse } from 'next/server';
import { listOperators, createOperator } from '@/lib/operators';
import { logAction } from '@/lib/auditLog';
import { requireAdmin, isNextResponse } from '@/lib/authServer';
import { CreateOperatorInput } from '@/types/operator';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isNextResponse(auth)) return auth;

  try {
    const operators = await listOperators();
    await logAction({
      action: 'operator.list',
      resource: 'operator',
      userId: auth.id,
      userEmail: auth.email,
      statusCode: 200,
      request,
      details: { count: operators.length },
    });
    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Erreur GET /api/operators:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des opérateurs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isNextResponse(auth)) return auth;

  try {
    const body = (await request.json()) as CreateOperatorInput;
    const result = await createOperator(body);
    if (result.errors) {
      await logAction({
        action: 'operator.create',
        resource: 'operator',
        userId: auth.id,
        userEmail: auth.email,
        statusCode: 400,
        request,
        details: { success: false, email: body?.email ?? null, errors: result.errors },
      });
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    await logAction({
      action: 'operator.create',
      resource: 'operator',
      resourceId: result.operator?.id ?? null,
      userId: auth.id,
      userEmail: auth.email,
      statusCode: 201,
      request,
      details: {
        success: true,
        email: result.operator?.email,
        firstName: result.operator?.firstName,
        lastName: result.operator?.lastName,
        role: result.operator?.role,
      },
    });
    return NextResponse.json({ operator: result.operator }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/operators:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'opérateur' }, { status: 500 });
  }
}
