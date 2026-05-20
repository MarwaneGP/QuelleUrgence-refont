import HospitalCard from "@/components/hopitaux/HospitalCard";
import type { AphpHospitalWithAttendance } from "@/lib/aphpHospitalsService";
import NotFoundData from "@/components/NotFoundData";

interface HospitalListProps {
  hospitals: AphpHospitalWithAttendance[];
}

function HospitalList({ hospitals }: HospitalListProps) {
    if (hospitals.length === 0) {
        return (
          <NotFoundData message="Aucun hôpital trouvé à proximité." />
        );
    }

    return (
        <div className="space-y-3" role="list" aria-label="Liste des hôpitaux avec services d'urgence, triée par recommandation">
            {hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.code}
                  hospital={hospital}
                />
            ))}
        </div>
    );
}

export default HospitalList;
