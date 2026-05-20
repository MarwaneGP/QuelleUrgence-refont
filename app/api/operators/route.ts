import { NextResponse } from 'next/server';
import { listOperators, createOperator } from '@/lib/operators';
import { CreateOperatorInput } from '@/types/operator';

export async function GET() {
  try {
    const operators = await listOperators();
    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Erreur GET /api/operators:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des opérateurs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOperatorInput;
    const result = await createOperator(body);
    if (result.errors) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    return NextResponse.json({ operator: result.operator }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/operators:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'opérateur' }, { status: 500 });
  }
}
