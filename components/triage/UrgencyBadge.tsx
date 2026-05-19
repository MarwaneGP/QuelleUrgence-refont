import { UrgencyLevel, URGENCY_LABELS, URGENCY_COLORS } from '@/types/triage';

interface Props {
  level: UrgencyLevel;
  large?: boolean;
}

export default function UrgencyBadge({ level, large }: Props) {
  const color = URGENCY_COLORS[level];
  const label = URGENCY_LABELS[level];

  return (
    <span
      style={{ backgroundColor: `${color}22`, color, borderColor: `${color}66` }}
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${
        large ? 'px-5 py-2 text-base' : 'px-3 py-1 text-sm'
      }`}
    >
      <span
        style={{ backgroundColor: color }}
        className={`rounded-full ${large ? 'w-3 h-3' : 'w-2 h-2'}`}
      />
      Niveau {level} — {label}
    </span>
  );
}
