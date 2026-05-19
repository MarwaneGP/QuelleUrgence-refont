import { NextResponse } from 'next/server';
import { getOperator, updateOperator, deleteOperator } from '@/lib/operators';
import { UpdateOperatorInput } from '@/types/operator';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const operator = getOperator(id);
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
    const body = (await request.json()) as UpdateOperatorInput;
    const result = await updateOperator(id, body);
    if (result.errors) {
      const status = result.errors.some(e => e.field === 'id') ? 404 : 400;
      return NextResponse.json({ errors: result.errors }, { status });
    }
    return NextResponse.json({ operator: result.operator });
  } catch (error) {
    console.error('Erreur PUT /api/operators/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteOperator(id);
  if (!ok) {
    return NextResponse.json({ error: 'Opérateur introuvable' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
