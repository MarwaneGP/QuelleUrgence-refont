import { NextResponse } from 'next/server';
import { getOperator, updateOperator, deleteOperator } from '@/lib/operators';
import { logAction } from '@/lib/auditLog';
import { requireAdmin, isNextResponse } from '@/lib/authServer';
import { UpdateOperatorInput } from '@/types/operator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const operator = await getOperator(id);
  if (!operator) {
    return NextResponse.json({ error: 'Opérateur introuvable' }, { status: 404 });
  }
  return NextResponse.json({ operator });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isNextResponse(auth)) return auth;

  try {
    const { id } = await params;
    const before = await getOperator(id);
    const body = (await request.json()) as UpdateOperatorInput;
    const result = await updateOperator(id, body);

    if (result.errors) {
      const status = result.errors.some(e => e.field === 'id') ? 404 : 400;
      await logAction({
        action: 'operator.update',
        resource: 'operator',
        resourceId: id,
        userId: auth.id,
        userEmail: auth.email,
        statusCode: status,
        request,
        details: { success: false, errors: result.errors, changed: Object.keys(body ?? {}) },
      });
      return NextResponse.json({ errors: result.errors }, { status });
    }

    await logAction({
      action: 'operator.update',
      resource: 'operator',
      resourceId: id,
      userId: auth.id,
      userEmail: auth.email,
      statusCode: 200,
      request,
      details: {
        success: true,
        changed: Object.keys(body ?? {}).filter(k => k !== 'password'),
        passwordChanged: Boolean(body?.password),
        before: before
          ? {
              email: before.email,
              firstName: before.firstName,
              lastName: before.lastName,
              role: before.role,
            }
          : null,
        after: result.operator
          ? {
              email: result.operator.email,
              firstName: result.operator.firstName,
              lastName: result.operator.lastName,
              role: result.operator.role,
            }
          : null,
      },
    });
    return NextResponse.json({ operator: result.operator });
  } catch (error) {
    console.error('Erreur PUT /api/operators/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  // Empêche un admin de se supprimer lui-même.
  if (id === auth.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas supprimer votre propre compte.' },
      { status: 400 }
    );
  }

  const before = await getOperator(id);
  const ok = await deleteOperator(id);

  if (!ok) {
    await logAction({
      action: 'operator.delete',
      resource: 'operator',
      resourceId: id,
      userId: auth.id,
      userEmail: auth.email,
      statusCode: 404,
      request,
      details: { success: false },
    });
    return NextResponse.json({ error: 'Opérateur introuvable' }, { status: 404 });
  }

  await logAction({
    action: 'operator.delete',
    resource: 'operator',
    resourceId: id,
    userId: auth.id,
    userEmail: auth.email,
    statusCode: 200,
    request,
    details: {
      success: true,
      deleted: before
        ? {
            email: before.email,
            firstName: before.firstName,
            lastName: before.lastName,
            role: before.role,
          }
        : null,
    },
  });
  return NextResponse.json({ success: true });
}
