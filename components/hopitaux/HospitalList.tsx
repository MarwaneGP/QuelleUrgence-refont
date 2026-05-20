import HospitalCard from "@/components/hopitaux/HospitalCard";
import type { AphpHospitalWithAttendance } from "@/lib/aphpHospitalsService";
import NotFoundData from "@/components/NotFoundData";

interface HospitalListProps {
  hospitals: AphpHospitalWithAttendance[];
  onSelect?: (hospital: AphpHospitalWithAttendance) => void;
  activeHospitalCode?: string | null;
}

export default function HospitalList({ hospitals, onSelect, activeHospitalCode }: HospitalListProps) {
  if (hospitals.length === 0) {
    return (
      <NotFoundData message="Aucun établissement trouvé." />
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="Liste des hôpitaux triée par recommandation">
      {hospitals.map((hospital) => (
        <HospitalCard
          key={hospital.code}
          hospital={hospital}
          onSelect={onSelect}
          isActive={activeHospitalCode === hospital.code}
        />
      ))}
    </div>
  );
}
