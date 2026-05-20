import Link from "next/link";
import Image from "next/image";
import type { AphpHospitalWithAttendance } from "@/lib/aphpHospitalsService";

interface HospitalCardProps {
  hospital: AphpHospitalWithAttendance;
}

const SERVICE_LABELS: Record<string, string> = {
  emergency: "Urgences",
  cardiology: "Cardiologie",
  neurology: "Neurologie",
  pediatrics: "Pediatrie",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  ct_scan: "Scanner",
  mri: "IRM",
  pet_scan: "TEP",
  nuclear_camera: "Camera scintillation",
  cyclotron: "Cyclotron",
};

const CAPABILITY_LABELS: Record<string, string> = {
  emergency: "Prise en charge urgences",
  cardiology: "Cardiologie",
  neurology: "Neurologie",
  cardiacEmergency: "Urgence cardiaque",
  stroke: "Parcours AVC",
  imaging: "Imagerie lourde",
  crowded: "Tres frequente",
};

function getBusyInfo(pam: number | null) {
  if (pam === null) {
    return {
      label: "Indisponible",
      className: "bg-slate-200 text-slate-800",
      barClassName: "bg-slate-400",
      progress: 0,
    };
  }

  if (pam < 12) {
    return {
      label: "Faible",
      className: "bg-emerald-100 text-emerald-900",
      barClassName: "bg-emerald-500",
      progress: 25,
    };
  }

  if (pam < 20) {
    return {
      label: "Moderee",
      className: "bg-amber-100 text-amber-900",
      barClassName: "bg-amber-500",
      progress: 50,
    };
  }

  if (pam < 30) {
    return {
      label: "Elevee",
      className: "bg-orange-100 text-orange-900",
      barClassName: "bg-orange-500",
      progress: 75,
    };
  }

  return {
    label: "Tres elevee",
    className: "bg-rose-100 text-rose-900",
    barClassName: "bg-rose-600",
    progress: 100,
  };
}

function HospitalCard({ hospital }: HospitalCardProps) {
  const pam = hospital.attendance?.PAM ?? null;
  const dps = hospital.attendance?.DPS ?? null;
  const pss = hospital.attendance?.PSS ?? null;
  const busy = getBusyInfo(pam);
  const cardLabel = `${hospital.name}. Hopital avec services d'urgence.`;
  const services = (hospital.services ?? []).filter((service) => service !== "emergency");
  const equipment = hospital.equipment ?? [];
  const capabilities = Object.entries(hospital.capabilities ?? {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => CAPABILITY_LABELS[key] ?? key);

  return (
    <article
      className="p-4 rounded-lg shadow-md hover:shadow-lg transition-all focus-within:ring-4 focus-within:ring-red-600 focus-within:ring-offset-2 focus-within:ring-offset-slate-100 bg-primary"
      role="listitem"
      aria-label={cardLabel}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-bold text-white flex-1 text-lg min-w-0">{hospital.name}</h2>
        <span
          className={`flex-shrink-0 font-bold py-1.5 px-3 rounded-full text-sm ${busy.className}`}
          aria-label={`Affluence actuelle : ${busy.label}`}
        >
          {busy.label}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-white/90 text-sm mb-1">Affluence actuelle</p>
        <div className="h-2 w-full rounded-full bg-white/25 overflow-hidden" aria-hidden="true">
          <div
            className={`h-full ${busy.barClassName}`}
            style={{ width: `${busy.progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white">
          {pam !== null
            ? `${pam} patients actuellement au SAU`
            : "Donnees d'affluence indisponibles pour le moment"}
        </p>
        <p className="text-xs text-white/85 mt-1">
          {dps !== null && pss !== null
            ? `Temps total estime : ${dps} min - Delai medecin : ${pss} min`
            : "Temps estimes indisponibles"}
        </p>
      </div>

      <div className="space-y-3 mt-4">
        {services.length > 0 && (
          <div>
            <p className="text-white/90 text-sm mb-1">Services</p>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <span key={service} className="px-2 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  {SERVICE_LABELS[service] ?? service}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-white/90 text-sm mb-1">Equipements</p>
          {equipment.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {equipment.map((item) => (
                <span key={item} className="px-2 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  {EQUIPMENT_LABELS[item] ?? item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/80">Non renseigne</p>
          )}
        </div>

        <div>
          <p className="text-white/90 text-sm mb-1">Capacites detectees</p>
          {capabilities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <span key={capability} className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-white">
                  {capability}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/80">Non renseigne</p>
          )}
        </div>
      </div>

      {hospital.phone && (
        <Link
          href={`tel:${hospital.phone}`}
          className="flex items-center gap-2 w-fit mt-3 focus:outline-none focus:ring-4 focus:ring-slate-500 rounded px-2 py-1 -ml-2 hover:bg-black/10 transition-colors"
          aria-label={`Appeler ${hospital.name} au ${hospital.phone}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src="/images/icons/phone-white.svg"
            alt=""
            width={20}
            height={20}
            quality={100}
            aria-hidden="true"
          />
          <span className="text-white font-bold underline">{hospital.phone}</span>
        </Link>
      )}

      {!hospital.phone && (
        <p className="text-white/90 text-sm italic">Aucun numero de telephone disponible</p>
      )}
    </article>
  );
}

export default HospitalCard;

