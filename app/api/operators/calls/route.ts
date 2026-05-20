import { NextRequest, NextResponse } from 'next/server';
import { listOperatorCalls, saveOperatorCall } from '@/lib/operatorCalls';
import { CreateOperatorCallInput } from '@/types/operator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.operatorId) {
      return NextResponse.json(
        { error: 'operatorId est requis' },
        { status: 400 }
      );
    }

    if (!body.caller || !body.location || !body.event || !body.vitalAssessment) {
      return NextResponse.json(
        { error: 'Donnees incompletes' },
        { status: 400 }
      );
    }

    const callData: CreateOperatorCallInput = body;
    const savedCall = saveOperatorCall(callData);

    console.log('Nouvel appel enregistre:', {
      id: savedCall.id,
      operatorId: savedCall.operatorId,
      hospitalLinkUrl: savedCall.hospitalLinkUrl,
    });
    console.log(`Lien hopital unique: ${savedCall.hospitalLinkUrl}`);

    return NextResponse.json(
      {
        id: savedCall.id,
        success: true,
        message: 'Appel enregistre avec succes',
        hospitalLinkUrl: savedCall.hospitalLinkUrl,
        data: savedCall,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'appel:", error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const operatorId = request.nextUrl.searchParams.get('operatorId');
    const limit = request.nextUrl.searchParams.get('limit') || '50';

    if (!operatorId) {
      return NextResponse.json(
        { error: 'operatorId est requis' },
        { status: 400 }
      );
    }

    const calls = listOperatorCalls(operatorId, Number.parseInt(limit, 10) || 50);

    return NextResponse.json(
      {
        calls,
        total: calls.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la recuperation des appels:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
