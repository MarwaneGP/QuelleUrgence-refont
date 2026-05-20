import { NextRequest, NextResponse } from 'next/server';
import { CreateOperatorCallInput } from '@/types/operator';

/**
 * POST /api/operators/calls
 * Enregistre un nouvel appel d'urgence depuis un opérateur
 * 
 * Body: CreateOperatorCallInput
 * - operatorId: ID de l'opérateur
 * - caller: Informations du patient/appelant
 * - location: Localisation de l'urgence
 * - event: Détails de l'événement
 * - vitalAssessment: Bilan vital
 * - remarqueGenerale?: Notes supplémentaires
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation basique
    if (!body.operatorId) {
      return NextResponse.json(
        { error: 'operatorId est requis' },
        { status: 400 }
      );
    }

    if (!body.caller || !body.location || !body.event || !body.vitalAssessment) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // TODO: Implémenter la sauvegarde en base de données
    // - Connecter à Supabase
    // - Valider et nettoyer les données
    // - Insérer dans la table appropriée
    // - Retourner l'ID et les données sauvegardées

    // Pour maintenant, simuler la réponse
    const callData: CreateOperatorCallInput = body;
    const id = `CALL-${Date.now()}`;

    console.log('Nouvel appel enregistré:', { id, ...callData });

    return NextResponse.json(
      {
        id,
        success: true,
        message: 'Appel enregistré avec succès',
        data: {
          ...callData,
          id,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'appel:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/operators/calls
 * Récupère les appels d'un opérateur
 */
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

    // TODO: Récupérer les appels de cet opérateur depuis Supabase

    return NextResponse.json(
      {
        calls: [],
        total: 0,
        message: 'Pas d\'appels trouvés pour cet opérateur',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des appels:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
