"use client";

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import HospitalList from '@/components/hopitaux/HospitalList';
import MapWrapper from '@/components/MapWrapper';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

interface AttendanceSnapshot {
  PAM: number | null;
  DVI: number | null;
  DVM: number | null;
  DPS: number | null;
  PSS: number | null;
}

interface HospitalCapabilities {
  emergency: boolean;
  cardiology: boolean;
  neurology: boolean;
  cardiacEmergency: boolean;
  stroke: boolean;
  imaging: boolean;
  crowded: boolean;
}

interface AphpHospitalWithAttendance {
  id: string | null;
  code: string;
  name: string;
  sourceName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance: AttendanceSnapshot | null;
  attendanceRawCount: number;
  services: string[];
  equipment: string[];
  capabilities: HospitalCapabilities;
}

interface LiveHospitalsResponse {
  generatedAt: string;
  count: number;
  hospitals: AphpHospitalWithAttendance[];
  error?: string;
  details?: string;
}

const HOSPITALS_CACHE_KEY = 'aphp_live_hospitals_cache_v2';
const HOSPITALS_CACHE_TTL_MS = 10 * 60 * 1000;

export default function HopitauxPage() {
  const [hospitals, setHospitals] = useState<AphpHospitalWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Général');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeHospital, setActiveHospital] = useState<AphpHospitalWithAttendance | null>(null);

  // Map view configuration based on selected hospital
  const mapCenter = useMemo<[number, number] | undefined>(() => {
    if (activeHospital && activeHospital.latitude && activeHospital.longitude) {
      return [activeHospital.latitude, activeHospital.longitude];
    }
    return undefined;
  }, [activeHospital]);

  useEffect(() => {
    function readCache(): AphpHospitalWithAttendance[] | null {
      try {
        const raw = sessionStorage.getItem(HOSPITALS_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as {
          savedAt: number;
          hospitals: AphpHospitalWithAttendance[];
        };

        if (!parsed || !Array.isArray(parsed.hospitals)) return null;
        if (Date.now() - parsed.savedAt > HOSPITALS_CACHE_TTL_MS) return null;

        return parsed.hospitals;
      } catch {
        return null;
      }
    }

    function writeCache(items: AphpHospitalWithAttendance[]) {
      try {
        sessionStorage.setItem(
          HOSPITALS_CACHE_KEY,
          JSON.stringify({ savedAt: Date.now(), hospitals: items })
        );
      } catch {
        // Ignore cache write errors
      }
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      const cached = readCache();
      if (cached) {
        setHospitals(cached);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/hospitals/aphp-live', { cache: 'no-store' });
        const data = (await res.json()) as LiveHospitalsResponse;

        if (!res.ok) {
          setError(data.details || data.error || `Erreur API (${res.status})`);
          return;
        }

        const nextHospitals = data.hospitals || [];
        setHospitals(nextHospitals);
        writeCache(nextHospitals);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredHospitals = useMemo(() => {
    let result = hospitals;

    // Apply Specialty tags filtering
    if (selectedSpecialty === 'Radiologie') {
      result = result.filter(h => h.capabilities?.imaging);
    } else if (selectedSpecialty === 'Traumatologie') {
      result = result.filter(h => h.capabilities?.emergency);
    } else if (selectedSpecialty === 'Pédiatrie') {
      result = result.filter(h => 
        h.services?.includes('pediatrics') || 
        h.name.toLowerCase().includes('pedi') || 
        h.name.toLowerCase().includes('enfant')
      );
    }

    // Apply Search Query filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return result;

    return result.filter((hospital) => {
      const filteredServices = hospital.services.filter((service) => service !== 'emergency');
      const capabilities = Object.entries(hospital.capabilities || {})
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
        .join(' ');

      const haystack = `${hospital.name} ${hospital.sourceName || ''} ${hospital.city || ''} ${filteredServices.join(' ')} ${hospital.equipment.join(' ')} ${capabilities}`
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [hospitals, searchQuery, selectedSpecialty]);

  const handleHospitalSelect = (hospital: AphpHospitalWithAttendance) => {
    setActiveHospital(hospital);
    // On mobile, automatically transition to Map view when an item is selected
    if (window.innerWidth < 768) {
      setViewMode('map');
    }
  };

  const specialtyChips = ['Général', 'Radiologie', 'Traumatologie', 'Pédiatrie'];

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 pb-16 md:pb-0 md:pl-64 flex flex-col h-screen overflow-hidden"
        tabIndex={-1}
      >
        {/* Top bar on Mobile containing view mode segmented switches */}
        <div className="md:hidden px-4 py-3 bg-[var(--bg-frame)] border-b border-[var(--border-color)] flex-shrink-0">
          <div className="bg-[var(--bg-input)] rounded-full p-1 flex">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-frame)] text-[var(--primary)] shadow-sm'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-[var(--bg-frame)] text-[var(--primary)] shadow-sm'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Carte
            </button>
          </div>
        </div>

        {/* Master Flex container for side-by-side layout */}
        <div className="flex-1 flex w-full h-full overflow-hidden">
          {/* Left panel: search panel & card lists */}
          <div
            className={`w-full md:w-[400px] h-full flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-frame)] flex-shrink-0 z-10 overflow-hidden ${
              viewMode === 'list' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Search Input Container */}
            <div className="p-4 border-b border-[var(--border-color)] space-y-3.5 flex-shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[var(--text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Rechercher un symptôme, un hôpital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-input)] hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-[var(--bg-frame)] focus:ring-2 focus:ring-[var(--primary)] text-sm font-semibold rounded-full border-none text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none"
                />
              </div>

              {/* Horizontal filter chips list */}
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none scrollable-x">
                {specialtyChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSelectedSpecialty(chip)}
                    className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border flex-shrink-0 ${
                      selectedSpecialty === chip
                        ? 'bg-[var(--primary)] text-white border-transparent shadow-sm'
                        : 'bg-[var(--bg-badge-inactive)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* List Results Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="mb-2">
                <h2 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                  Urgences recommandées
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Classées par ordre de prise en charge la plus rapide
                </p>
              </div>

              {loading && (
                <div className="py-20 flex justify-center">
                  <Loading message="Recherche des hôpitaux AP-HP..." />
                </div>
              )}

              {error && <ErrorMessage message={error} />}

              {!loading && !error && (
                <HospitalList
                  hospitals={filteredHospitals}
                  onSelect={handleHospitalSelect}
                  activeHospitalCode={activeHospital?.code}
                />
              )}

              {/* Real-time disclaimer card */}
              <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-badge-inactive)] text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1 mt-4">
                <strong className="text-[var(--text-main)] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Données en temps réel via API
                </strong>
                Les temps d&apos;attente sont actualisés en continu. En cas d&apos;urgence vitale absolue, composez immédiatement le 15.
              </div>
            </div>
          </div>

          {/* Right panel: Leaflet Map */}
          <div
            className={`flex-1 h-full relative ${
              viewMode === 'map' ? 'block' : 'hidden md:block'
            }`}
          >
            <MapWrapper
              fullScreen
              initialCenter={mapCenter}
              initialZoom={activeHospital ? 15 : undefined}
            />

            {/* Float selection card on mobile view map overlay */}
            {activeHospital && (
              <div className="absolute bottom-4 left-4 right-4 bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-premium)] z-[500] animate-fade-in md:hidden">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-extrabold text-[var(--text-main)] max-w-[70%] leading-tight">
                    {activeHospital.name}
                  </h4>
                  <button
                    onClick={() => setActiveHospital(null)}
                    className="text-[var(--text-light)] hover:text-[var(--text-main)] p-0.5 rounded-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs mt-3">
                  <span className="text-[var(--text-muted)] font-semibold">2.5 km · 10 min en voiture</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)] uppercase">
                    Disponible
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
