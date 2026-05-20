import { NextResponse } from 'next/server';
import { getOperator, updateOperator, deleteOperator } from '@/lib/operators';
import { logAction } from '@/lib/auditLog';
import { UpdateOperatorInput } from '@/types/operator';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      statusCode: 200,
      request,
      details: {
        success: true,
        changed: Object.keys(body ?? {}).filter(k => k !== 'password'),
        passwordChanged: Boolean(body?.password),
        before: before
          ? { email: before.email, firstName: before.firstName, lastName: before.lastName }
          : null,
        after: result.operator
          ? {
              email: result.operator.email,
              firstName: result.operator.firstName,
              lastName: result.operator.lastName,
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
  const { id } = await params;
  const before = await getOperator(id);
  const ok = await deleteOperator(id);

  if (!ok) {
    await logAction({
      action: 'operator.delete',
      resource: 'operator',
      resourceId: id,
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
    statusCode: 200,
    request,
    details: {
      success: true,
      deleted: before
        ? { email: before.email, firstName: before.firstName, lastName: before.lastName }
        : null,
    },
  });
  return NextResponse.json({ success: true });
}
