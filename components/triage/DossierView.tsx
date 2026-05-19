import { Dossier } from '@/types/triage';
import UrgencyBadge from './UrgencyBadge';

interface Props {
  dossier: Dossier;
}

export default function DossierView({ dossier }: Props) {
  const createdAt = new Date(dossier.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {dossier.patient.firstName} {dossier.patient.lastName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {dossier.patient.age} ans · {dossier.patient.gender} · Dossier créé le{' '}
            {createdAt.toLocaleDateString('fr-FR', { dateStyle: 'long' })} à{' '}
            {createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <UrgencyBadge level={dossier.triage.urgencyLevel} large />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Analyse médicale</h2>
        <p className="text-gray-600 leading-relaxed">{dossier.triage.analysis}</p>

        <div
          className={`p-4 rounded-lg border-l-4 ${
            dossier.triage.shouldGoToEmergency
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-green-50 border-green-500 text-green-800'
          }`}
        >
          <p className="font-semibold text-sm mb-1">
            {dossier.triage.shouldGoToEmergency ? '⚠ Passage aux urgences recommandé' : '✓ Urgences non nécessaires'}
          </p>
          <p className="text-sm">{dossier.triage.recommendation}</p>
        </div>

        {dossier.triage.recommendedSpecialties.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Spécialités recommandées</p>
            <div className="flex flex-wrap gap-2">
              {dossier.triage.recommendedSpecialties.map(s => (
                <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Symptômes déclarés</h2>
        {dossier.symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dossier.symptoms.map(s => (
              <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">{s}</span>
            ))}
          </div>
        )}
        <p className="text-gray-600 text-sm leading-relaxed">{dossier.symptomDescription}</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">Durée :</span> {dossier.durationHours}h
          </div>
          {dossier.chronicConditions && (
            <div>
              <span className="font-medium">Antécédents :</span> {dossier.chronicConditions}
            </div>
          )}
          {dossier.allergies && (
            <div>
              <span className="font-medium">Allergies :</span> {dossier.allergies}
            </div>
          )}
          <div>
            <span className="font-medium">Tél. :</span> {dossier.patient.phone || 'Non renseigné'}
          </div>
        </div>
      </div>

      {dossier.hospitals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Hôpitaux recommandés</h2>
          <div className="space-y-3">
            {dossier.hospitals.map((h, i) => (
              <div key={h.code} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#1a1a2e] text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{h.name}</p>
                    {h.address && <p className="text-xs text-gray-500">{h.address}</p>}
                  </div>
                </div>
                <div className="text-right text-sm shrink-0 ml-4 space-y-0.5">
                  {h.totalPatients !== undefined && (
                    <p className={`font-semibold text-xs ${h.totalPatients < 20 ? 'text-green-600' : h.totalPatients < 40 ? 'text-orange-500' : 'text-red-600'}`}>
                      {h.totalPatients} patients
                    </p>
                  )}
                  {h.waitTime !== undefined && (
                    <p className="text-xs text-gray-500">~{h.waitTime} min</p>
                  )}
                  {h.totalPatients === undefined && (
                    <p className="text-xs text-gray-400">Affluence N/A</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
