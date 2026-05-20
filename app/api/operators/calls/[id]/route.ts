import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

interface OperatorCallRow {
  id: string;
  operator_id: string;
  caller: unknown;
  location: unknown;
  event: unknown;
  vital_assessment: unknown;
  remarque_generale: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

type PatchPayload = {
  caller?: unknown;
  location?: unknown;
  event?: unknown;
  vitalAssessment?: unknown;
  remarqueGenerale?: string | null;
  status?: 'new' | 'in_progress' | 'closed';
};

function toResponse(row: OperatorCallRow) {
  return {
    id: row.id,
    operatorId: row.operator_id,
    caller: row.caller,
    location: row.location,
    event: row.event,
    vitalAssessment: row.vital_assessment,
    remarqueGenerale: row.remarque_generale ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/operators/calls/[id]
 * Récupère les détails d'un appel spécifique
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID de l'appel requis" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('operator_calls')
      .select(
        'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Appel non trouvé' }, { status: 404 });

    return NextResponse.json({ call: toResponse(data as OperatorCallRow) }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'appel:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/operators/calls/[id]
 * Met à jour un appel existant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchPayload;

    if (!id) {
      return NextResponse.json({ error: "ID de l'appel requis" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.caller !== undefined) updatePayload.caller = body.caller;
    if (body.location !== undefined) updatePayload.location = body.location;
    if (body.event !== undefined) updatePayload.event = body.event;
    if (body.vitalAssessment !== undefined) updatePayload.vital_assessment = body.vitalAssessment;
    if (body.remarqueGenerale !== undefined) updatePayload.remarque_generale = body.remarqueGenerale;
    if (body.status !== undefined) updatePayload.status = body.status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('operator_calls')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, operator_id, caller, location, event, vital_assessment, remarque_generale, status, created_at, updated_at'
      )
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Appel non trouvé' }, { status: 404 });

    return NextResponse.json(
      {
        success: true,
        message: 'Appel mis à jour avec succès',
        data: toResponse(data as OperatorCallRow),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'appel:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/operators/calls/[id]
 * Supprime un appel
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID de l'appel requis" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { error } = await sb.from('operator_calls').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true, message: 'Appel supprimé avec succès' }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'appel:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
