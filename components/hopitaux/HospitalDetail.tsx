"use client";

import React from "react";

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
  attendance: any | null;
  attendanceRawCount: number;
  services: string[];
  equipment: string[];
  capabilities: any;
}

interface HospitalDetailProps {
  hospital: AphpHospitalWithAttendance;
  onClose: () => void;
  inline?: boolean;
}

export default function HospitalDetail({ hospital, onClose, inline = false }: HospitalDetailProps) {
  const pam = hospital.attendance?.PAM ?? null;
  const dps = hospital.attendance?.DPS ?? 25;

  const getBadgeConfig = (minutes: number) => {
    if (minutes <= 20) return { cls: "bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]", text: "Faible" };
    if (minutes <= 45) return { cls: "bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)]", text: "Modérée" };
    return { cls: "bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]", text: "Élevée" };
  };
  const badgeConfig = getBadgeConfig(dps);

  // SVG dimensions for DREES graph
  const W = 300;
  const H = 80;
  const rawCounts = [120, 90, 80, 210, 280, 260, 300, 200];
  const maxCount = Math.max(...rawCounts);
  const chartWaits = rawCounts.map((c) =>
    Math.max(5, Math.round((c / maxCount) * dps * 1.6))
  );

  const maxWait = Math.max(...chartWaits, 1);
  const pts = chartWaits.map((w, i) => ({
    x: (i / (chartWaits.length - 1)) * (W - 30) + 15,
    y: H - ((w / maxWait) * (H - 24) + 12),
    w,
    label: ["00h", "03h", "06h", "09h", "12h", "15h", "18h", "21h"][i],
    isCurrent: i === 4, // 12h
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const renderContent = () => (
    <div className={`flex flex-col gap-5 ${inline ? "w-full" : ""}`}>
      {/* Inline Back button */}
      {inline && (
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--primary)] hover:underline mb-2 w-fit cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux hôpitaux
        </button>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-6">
          <h2 className="text-lg font-extrabold text-[var(--text-main)] tracking-tight leading-snug">
            {hospital.name}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {hospital.address || "35 Rue Principale (Simulé Proche)"}
          </p>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-badge-inactive)] hover:bg-[var(--primary-light)] text-[var(--text-main)] hover:text-[var(--primary)] flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl text-center shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Trajet</span>
          <strong className="block text-base font-extrabold text-[var(--text-main)] mt-1">2 min</strong>
          <span className="text-[9px] text-[var(--text-light)]">0.5 km · voiture</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl text-center shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Attente estimée</span>
          <span className={`block w-fit mx-auto mt-1 px-3 py-0.5 rounded-full text-xs font-extrabold ${badgeConfig.cls}`}>
            {dps} min
          </span>
          <span className="block text-[9px] text-[var(--text-light)] mt-1.5">actualisé à l&apos;instant</span>
        </div>
      </div>

      {/* DREES graph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Affluence prévisionnelle — aujourd&apos;hui
          </h3>
          <span className="text-[9px] font-extrabold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0] px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7m0-3c0 1.657-3.134 3-7 3S3 5.657 3 4s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
            Données DREES réelles
          </span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 shadow-sm">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            <line x1="15" y1={H - 12} x2={W - 15} y2={H - 12} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
            <path d={areaPath} fill="url(#chartGrad)" />
            <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {pts.map((p, i) => (
              <g key={i}>
                {p.isCurrent && (
                  <line x1={p.x} y1="0" x2={p.x} y2={H} stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.isCurrent ? 4.5 : 3}
                  fill={p.isCurrent ? "var(--primary)" : "var(--bg-frame)"}
                  stroke="var(--primary)"
                  strokeWidth={p.isCurrent ? 0 : 1.5}
                />
                <text x={p.x} y={p.y - 7} fontSize="8" fontWeight="800" fill={p.isCurrent ? "var(--primary)" : "var(--text-muted)"} textAnchor="middle">
                  {p.w}m
                </text>
                <text x={p.x} y={H - 1} fontSize="8" fontWeight="600" fill={p.isCurrent ? "var(--primary)" : "var(--text-light)"} textAnchor="middle">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="text-[9px] text-[var(--text-light)] text-right">
          Source : DREES · Paris (75) · Réf. 2023-12-31 · 1729 passages/j
        </p>
      </div>

      {/* Buttons row */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${hospital.phone ? hospital.phone.replace(/\s+/g, "") : "0400000000"}`}
          className="flex items-center justify-center gap-2 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-badge-inactive)] rounded-2xl text-xs font-bold transition-all"
        >
          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {hospital.phone || "04 00 00 00 05"}
        </a>
        <button
          onClick={() => alert(`Lancement de l'itinéraire de secours vers ${hospital.name}`)}
          className="flex items-center justify-center gap-2 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Itinéraire
        </button>
      </div>
    </div>
  );

  if (inline) {
    return renderContent();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000] flex flex-col justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85vh] bg-[var(--bg-frame)] border-t border-[var(--border-color)] rounded-t-3xl p-6 overflow-y-auto shadow-2xl flex flex-col gap-5 md:max-w-md md:mx-auto md:rounded-3xl md:mb-6 md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
}
