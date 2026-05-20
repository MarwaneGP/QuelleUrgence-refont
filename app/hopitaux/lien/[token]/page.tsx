import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { getAphpHospitalsWithAttendance } from '@/lib/aphpHospitalsService';
import {
  geocodeOperatorCallLocation,
  rankHospitalsForOperatorCall,
  RankedHospital,
} from '@/lib/hospitalLinkRecommendations';
import { getOperatorCallByHospitalToken } from '@/lib/operatorCalls';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Hopitaux recommandes - QuelleUrgence',
  robots: {
    index: false,
    follow: false,
  },
};

function formatAttendance(hospital: RankedHospital): string {
  const wait = hospital.attendance?.DPS;
  const patients = hospital.attendance?.PAM;

  if (typeof wait === 'number' && typeof patients === 'number') {
    return `${wait} min d'attente estimee - ${patients} patients au SAU`;
  }

  if (typeof wait === 'number') return `${wait} min d'attente estimee`;
  if (typeof patients === 'number') return `${patients} patients au SAU`;
  return 'Affluence indisponible';
}

function attendanceBadgeClasses(hospital: RankedHospital): string {
  const wait = hospital.attendance?.DPS;
  if (typeof wait !== 'number') return 'bg-gray-100 text-gray-600 border-gray-200';
  if (wait < 30) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (wait < 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function formatDistance(hospital: RankedHospital): string {
  if (hospital.distanceKm == null) return hospital.city ?? 'Distance indisponible';
  if (hospital.distanceKm < 1) return `${Math.round(hospital.distanceKm * 1000)} m`;
  return `${hospital.distanceKm.toFixed(1)} km`;
}

export default async function HospitalLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const call = getOperatorCallByHospitalToken(token);

  if (!call) {
    notFound();
  }

  let hospitals: RankedHospital[] = [];
  let error: string | null = null;

  try {
    const [allHospitals, coordinates] = await Promise.all([
      getAphpHospitalsWithAttendance(),
      geocodeOperatorCallLocation(call),
    ]);
    hospitals = rankHospitalsForOperatorCall(allHospitals, call, coordinates);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Impossible de charger les hopitaux';
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] pb-16 md:pb-0">
        <section className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary)]">
              Orientation hospitaliere
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text-main)] md:text-3xl">
              Hopitaux recommandes
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--text-muted)]">
              Liste classee automatiquement selon les informations de l'appel et les donnees d'affluence disponibles.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {!error && hospitals.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-frame)] p-6 text-sm font-semibold text-[var(--text-muted)]">
              Aucun hopital correspondant aux criteres du dossier n'a ete trouve.
            </div>
          )}

          {!error && hospitals.length > 0 && (
            <div className="grid gap-4">
              {hospitals.slice(0, 10).map((hospital, index) => (
                <article
                  key={hospital.code}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-frame)] p-5 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-extrabold text-white">
                          {index + 1}
                        </span>
                        <h2 className="text-lg font-extrabold leading-tight text-[var(--text-main)]">
                          {hospital.name}
                        </h2>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                        {hospital.address ? `${hospital.address}, ` : ''}
                        {hospital.postalCode ? `${hospital.postalCode} ` : ''}
                        {hospital.city ?? ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${attendanceBadgeClasses(hospital)}`}>
                        {formatAttendance(hospital)}
                      </span>
                      <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-badge-inactive)] px-3 py-1 text-xs font-extrabold text-[var(--text-muted)]">
                        {formatDistance(hospital)}
                      </span>
                      <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-badge-inactive)] px-3 py-1 text-xs font-extrabold text-[var(--text-muted)]">
                        Score {hospital.recommendationScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-xl bg-[var(--bg-input)] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                        Patients presents
                      </p>
                      <p className="mt-1 font-extrabold text-[var(--text-main)]">
                        {hospital.attendance?.PAM ?? 'Indisponible'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-input)] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                        Delai avant sortie
                      </p>
                      <p className="mt-1 font-extrabold text-[var(--text-main)]">
                        {typeof hospital.attendance?.DPS === 'number' ? `${hospital.attendance.DPS} min` : 'Indisponible'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-input)] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                        Contact
                      </p>
                      <p className="mt-1 font-extrabold text-[var(--text-main)]">
                        {hospital.phone || 'Non renseigne'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
