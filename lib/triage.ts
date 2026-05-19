import { SymptomForm, TriageResult, UrgencyLevel, Specialty } from '@/types/triage';

interface SymptomRule {
  urgency: UrgencyLevel;
  specialties: Specialty[];
  keywords: string[];
}

const SYMPTOM_RULES: SymptomRule[] = [
  {
    urgency: 5,
    specialties: ['neurologie', 'urgences générales'],
    keywords: ['perte de conscience', 'convulsions', 'paralysie', 'faiblesse soudaine', 'trouble de la parole'],
  },
  {
    urgency: 5,
    specialties: ['cardiologie', 'urgences générales'],
    keywords: ['douleur thoracique', 'arrêt cardiaque', 'infarctus'],
  },
  {
    urgency: 5,
    specialties: ['urgences générales', 'chirurgie générale'],
    keywords: ['saignement important', 'hémorragie', 'plaie grave'],
  },
  {
    urgency: 4,
    specialties: ['pneumologie', 'cardiologie'],
    keywords: ['essoufflement', 'dyspnée', 'difficultés respiratoires', 'oppression thoracique'],
  },
  {
    urgency: 4,
    specialties: ['neurologie'],
    keywords: ['trouble de la vision', 'perte de mémoire soudaine', 'maux de tête sévères', 'céphalée brutale'],
  },
  {
    urgency: 4,
    specialties: ['chirurgie générale', 'orthopédie'],
    keywords: ['traumatisme', 'chute', 'fracture', 'accident', 'brûlure'],
  },
  {
    urgency: 4,
    specialties: ['gastro-entérologie', 'chirurgie générale'],
    keywords: ['douleur abdominale', 'abdomen rigide', 'ventre dur'],
  },
  {
    urgency: 3,
    specialties: ['urgences générales'],
    keywords: ['fièvre élevée', 'fièvre', 'hyperthermie', '39°c', '40°c'],
  },
  {
    urgency: 3,
    specialties: ['gastro-entérologie'],
    keywords: ['vomissements', 'nausées sévères', 'diarrhée sévère'],
  },
  {
    urgency: 3,
    specialties: ['orthopédie', 'rhumatologie'],
    keywords: ['douleur dorsale', 'douleur articulaire', 'dos bloqué'],
  },
  {
    urgency: 3,
    specialties: ['chirurgie générale'],
    keywords: ['coupure profonde', 'plaie'],
  },
  {
    urgency: 2,
    specialties: ['urologie'],
    keywords: ['douleur urinaire', 'brûlure urinaire', 'infection urinaire'],
  },
  {
    urgency: 2,
    specialties: ['dermatologie'],
    keywords: ['éruption cutanée', 'urticaire', 'rash'],
  },
  {
    urgency: 2,
    specialties: ['neurologie'],
    keywords: ['maux de tête', 'migraine'],
  },
  {
    urgency: 2,
    specialties: ['ORL'],
    keywords: ['mal de gorge', 'otalgie', 'douleur oreille', 'sinusite'],
  },
  {
    urgency: 1,
    specialties: ['urgences générales'],
    keywords: ['fatigue', 'toux légère', 'rhume', 'courbatures'],
  },
];

const URGENCY_RECOMMENDATIONS: Record<UrgencyLevel, { go: boolean; text: string }> = {
  5: { go: true, text: 'Appelez immédiatement le 15 (SAMU) ou le 112. Ne conduisez pas vous-même.' },
  4: { go: true, text: 'Rendez-vous aux urgences dans l\'heure. Demandez à quelqu\'un de vous accompagner.' },
  3: { go: true, text: 'Consultez les urgences aujourd\'hui. Évitez d\'attendre demain.' },
  2: { go: false, text: 'Consultez un médecin dans les 24 à 48 heures. Pas besoin d\'urgences.' },
  1: { go: false, text: 'Prenez rendez-vous avec votre médecin traitant dans les jours à venir.' },
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  1: 'Non urgent',
  2: 'Semi-urgent',
  3: 'Urgent',
  4: 'Très urgent',
  5: 'Critique',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function matchRule(rule: SymptomRule, allText: string): boolean {
  return rule.keywords.some(kw => allText.includes(normalize(kw)));
}

function buildAnalysis(form: SymptomForm, level: UrgencyLevel, specialties: Specialty[]): string {
  const age = form.patient.age;
  const duration = form.durationHours;

  const parts: string[] = [
    `Patient de ${age} ans présentant : ${form.symptoms.slice(0, 3).join(', ')}${form.symptoms.length > 3 ? '...' : ''}.`,
  ];

  if (form.chronicConditions) parts.push(`Antécédents : ${form.chronicConditions}.`);

  if (level >= 4) {
    parts.push('Les symptômes nécessitent une prise en charge médicale urgente.');
  } else if (level === 3) {
    parts.push(`Symptômes présents depuis ${duration}h nécessitant une consultation rapide.`);
  } else {
    parts.push('Situation ne nécessitant pas une prise en charge aux urgences.');
  }

  if (specialties.length > 0) {
    parts.push(`Orientation recommandée : ${specialties.slice(0, 2).join(', ')}.`);
  }

  return parts.join(' ');
}

export async function analyzeSymptoms(form: SymptomForm): Promise<TriageResult> {
  const allText = normalize(
    [...form.symptoms, form.symptomDescription, form.chronicConditions].join(' ')
  );

  const matchedRules = SYMPTOM_RULES.filter(rule => matchRule(rule, allText));

  let urgencyLevel: UrgencyLevel = matchedRules.length > 0
    ? (Math.max(...matchedRules.map(r => r.urgency)) as UrgencyLevel)
    : 1;

  const specialtiesSet = new Set<Specialty>();
  for (const rule of matchedRules) {
    if (rule.urgency >= urgencyLevel - 1) {
      rule.specialties.forEach(s => specialtiesSet.add(s));
    }
  }

  // Aggravation selon l'âge et les antécédents
  if (form.patient.age >= 70 && urgencyLevel < 4) urgencyLevel = (urgencyLevel + 1) as UrgencyLevel;
  if (form.hasChronicConditions && urgencyLevel < 3 && urgencyLevel >= 2) {
    urgencyLevel = 3;
  }

  urgencyLevel = Math.min(5, Math.max(1, urgencyLevel)) as UrgencyLevel;

  const recommendedSpecialties = [...specialtiesSet].slice(0, 4);
  const rec = URGENCY_RECOMMENDATIONS[urgencyLevel];

  return {
    urgencyLevel,
    urgencyLabel: URGENCY_LABELS[urgencyLevel],
    recommendedSpecialties,
    analysis: buildAnalysis(form, urgencyLevel, recommendedSpecialties),
    shouldGoToEmergency: rec.go,
    recommendation: rec.text,
  };
}
