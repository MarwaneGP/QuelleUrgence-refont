"use client";

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import HospitalList from '@/components/hopitaux/HospitalList';
import SearchBar from '@/components/SearchBar';
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

export const dynamic = 'force-dynamic';

const HOSPITALS_CACHE_KEY = 'aphp_live_hospitals_cache_v2';
const HOSPITALS_CACHE_TTL_MS = 10 * 60 * 1000;

export default function HopitauxPage() {
  const [hospitals, setHospitals] = useState<AphpHospitalWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        // Ignore cache write errors (quota/private mode)
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
    const query = searchQuery.toLowerCase().trim();
    if (!query) return hospitals;

    return hospitals.filter((hospital) => {
      const filteredServices = hospital.services.filter((service) => service !== 'emergency');
      const capabilities = Object.entries(hospital.capabilities || {})
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
        .join(' ');

      const haystack = `${hospital.name} ${hospital.sourceName || ''} ${hospital.city || ''} ${filteredServices.join(' ')} ${hospital.equipment.join(' ')} ${capabilities}`
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [hospitals, searchQuery]);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50"
        tabIndex={-1}
      >
        <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto pb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 text-center">
            Hopitaux AP-HP - Affluence en temps reel
          </h1>

          <SearchBar
            placeholder="Rechercher un hopital AP-HP"
            value={searchQuery}
            onChange={setSearchQuery}
            className="mb-4"
          />

          {!loading && !error && hospitals.length > 0 && (
            <div className="text-center text-sm text-black mt-4 mb-6">
              {filteredHospitals.length} {filteredHospitals.length > 1 ? 'hopitaux trouves' : 'hopital trouve'}
            </div>
          )}

          {loading && (
            <Loading
              message="Chargement des hopitaux AP-HP..."
              ariaLabel="Chargement des hopitaux AP-HP et de leur affluence"
            />
          )}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && <HospitalList hospitals={filteredHospitals} />}
        </div>
      </main>
    </>
  );
}
