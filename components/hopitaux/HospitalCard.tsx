import Link from "next/link";
import type { AphpHospitalWithAttendance } from "@/lib/aphpHospitalsService";

interface HospitalCardProps {
  hospital: AphpHospitalWithAttendance;
  onSelect?: (hospital: AphpHospitalWithAttendance) => void;
  isActive?: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  emergency: "Urgences",
  cardiology: "Cardiologie",
  neurology: "Neurologie",
  pediatrics: "Pédiatrie",
};

const CAPABILITY_LABELS: Record<string, string> = {
  emergency: "Urgences",
  cardiology: "Cardiologie",
  neurology: "Neurologie",
  cardiacEmergency: "Cardiaque",
  stroke: "AVC",
  imaging: "Scanner/IRM",
  crowded: "Forte affluence",
};

export default function HospitalCard({ hospital, onSelect, isActive = false }: HospitalCardProps) {
  const pam = hospital.attendance?.PAM ?? null;
  const dps = hospital.attendance?.DPS ?? null;
  const pss = hospital.attendance?.PSS ?? null;

  // Compute wait time level & styling (matching the Figma screenshot aesthetic)
  const getWaitBadge = () => {
    if (dps === null) {
      return {
        label: "Indisponible",
        classes: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
      };
    }
    if (dps < 30) {
      return {
        label: `${dps} min d'attente`,
        classes: "bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]",
      };
    }
    if (dps < 60) {
      return {
        label: `${dps} min d'attente`,
        classes: "bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)]",
      };
    }
    return {
      label: `${dps} min d'attente`,
      classes: "bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]",
    };
  };

  const badge = getWaitBadge();
  const services = (hospital.services ?? []).filter((s) => s !== "emergency");
  
  // Format simulated distances/durations for mockup styling if lat/lng are present
  const distance = "2.5 km"; // Simulated
  const duration = "10 min";  // Simulated

  return (
    <article
      onClick={() => onSelect?.(hospital)}
      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
        isActive
          ? "bg-[var(--bg-card)] border-[var(--primary)] ring-1 ring-[var(--primary)] shadow-[var(--shadow-md)]"
          : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-gray-400 dark:hover:border-gray-500 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
      }`}
      role="listitem"
      aria-label={`${hospital.name}, temps d'attente ${badge.label}`}
    >
      <div>
        {/* Top title and wait time badge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="font-extrabold text-[var(--text-main)] text-sm leading-tight flex-1">
            {hospital.name}
          </h3>
          <span className={`flex-shrink-0 text-[10px] font-extrabold py-1 px-2.5 rounded-full uppercase tracking-wider ${badge.classes}`}>
            {badge.label}
          </span>
        </div>

        {/* Distance & Travel time */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-[var(--text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {distance}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-[var(--text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {duration} en voiture
          </span>
        </div>

        {/* Dynamic details inside */}
        <div className="text-[11px] text-[var(--text-muted)] space-y-1 mb-4">
          <p>
            {pam !== null ? (
              <span className="font-semibold text-[var(--text-main)]">{pam} patients</span>
            ) : (
              <span>Affluence indisponible</span>
            )}{" "}
            au SAU
          </p>
          {pss !== null && (
            <p className="opacity-80">Délai médecin moyen : {pss} min</p>
          )}
        </div>
      </div>

      {/* Specialties/capabilities bottom horizontal scroll */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[var(--primary-light)] text-[var(--primary)] uppercase tracking-wider">
          Général
        </span>
        {services.slice(0, 3).map((service) => (
          <span
            key={service}
            className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--bg-badge-inactive)] text-[var(--text-muted)]"
          >
            {SERVICE_LABELS[service] ?? service}
          </span>
        ))}
      </div>
    </article>
  );
}
