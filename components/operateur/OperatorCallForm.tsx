"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CreateOperatorCallInput, OperatorCall } from "@/types/operator";

interface AddressOption {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface OperatorCallFormProps {
  onSubmit: (data: CreateOperatorCallInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<OperatorCall>;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  operatorId: string;
}

const INCIDENT_TYPES = [
  "Malaise",
  "Traumatisme / chute",
  "Plaie / saignement",
  "Brûlure",
  "Intoxication",
  "Perte de conscience",
  "Convulsion",
  "Dyspnée",
  "Douleur thoracique",
  "Accident de la route",
  "Noyade",
  "Électrocution",
  "Allergique",
  "Autre",
];

const HOSPITAL_SERVICES = [
  "Urgences générales",
  "Cardiologie",
  "Neurologie",
  "Traumatologie",
  "Pédiatrie",
  "Gynécologie-Obstétrique",
  "Toxicologie",
  "Pneumologie",
  "Gastro-entérologie",
  "Chirurgie générale",
];

const CONSCIOUSNESS_STATES = [
  "Conscient et lucide",
  "Confus / désorienté",
  "Somnolent",
  "Inconscient",
  "Réactions aux stimuli",
];

const BREATHING_STATES = [
  "Respiration normale",
  "Respiration rapide (> 20/min)",
  "Respiration lente (< 12/min)",
  "Respiration difficile",
  "Arrêt respiratoire",
  "Bruits anormaux",
];

const BLEEDING_STATES = [
  "Aucun saignement",
  "Saignement léger",
  "Saignement modéré",
  "Saignement important",
  "Hémorragie",
];

const SPEECH_STATES = [
  "Parole normale",
  "Parole difficile",
  "Bégaiement",
  "Trouble du langage",
  "Incohérence",
  "Mutisme",
];

interface FormData {
  telephone: string;
  nom: string;
  prenom: string;
  age: string;
  sexe: "homme" | "femme" | "autre";
  ville: string;
  adresse_rue_et_num: string;
  adresse_complements: string;
  latitude?: number;
  longitude?: number;
  type_incident: string[];
  service_concerne_hopital: string[];
  nombre_personnes: string;
  depuis_quand: string;
  details_evenement: string;
  etat_conscience: string;
  etat_respiration: string;
  etat_saignement: string;
  etat_parole: string;
  remarqueGenerale: string;
}

const INITIAL_FORM: FormData = {
  telephone: "",
  nom: "",
  prenom: "",
  age: "",
  sexe: "homme",
  ville: "",
  adresse_rue_et_num: "",
  adresse_complements: "",
  latitude: undefined,
  longitude: undefined,
  type_incident: [],
  service_concerne_hopital: [],
  nombre_personnes: "1",
  depuis_quand: "",
  details_evenement: "",
  etat_conscience: "",
  etat_respiration: "",
  etat_saignement: "",
  etat_parole: "",
  remarqueGenerale: "",
};

export default function OperatorCallForm({
  onSubmit,
  onCancel,
  initialData,
  loading = false,
  error: externalError,
  success: externalSuccess,
  operatorId,
}: OperatorCallFormProps) {
  const [form, setForm] = useState<FormData>(
    initialData
      ? {
          telephone: initialData.caller?.telephone || "",
          nom: initialData.caller?.nom || "",
          prenom: initialData.caller?.prenom || "",
          age: String(initialData.caller?.age || ""),
          sexe: initialData.caller?.sexe || "homme",
          ville: initialData.location?.ville || "",
          adresse_rue_et_num: initialData.location?.adresse_rue_et_num || "",
          adresse_complements: initialData.location?.adresse_complements || "",
          latitude: initialData.location?.latitude,
          longitude: initialData.location?.longitude,
          type_incident: initialData.event?.type_incident || [],
          service_concerne_hopital: initialData.event?.service_concerne_hopital || [],
          nombre_personnes: String(initialData.event?.nombre_personnes || "1"),
          depuis_quand: initialData.event?.depuis_quand || "",
          details_evenement: initialData.event?.details_evenement || "",
          etat_conscience: initialData.vitalAssessment?.etat_conscience || "",
          etat_respiration: initialData.vitalAssessment?.etat_respiration || "",
          etat_saignement: initialData.vitalAssessment?.etat_saignement || "",
          etat_parole: initialData.vitalAssessment?.etat_parole || "",
          remarqueGenerale: initialData.remarqueGenerale || "",
        }
      : INITIAL_FORM
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [internalSuccess, setInternalSuccess] = useState(false);

  // Address search states
  const [villeSuggestions, setVilleSuggestions] = useState<AddressOption[]>([]);
  const [adresseSuggestions, setAdresseSuggestions] = useState<AddressOption[]>([]);
  const [showVilleDropdown, setShowVilleDropdown] = useState(false);
  const [showAdresseDropdown, setShowAdresseDropdown] = useState(false);
  const [villeLoading, setVilleLoading] = useState(false);
  const [adresseLoading, setAdresseLoading] = useState(false);
  const villeDropdownRef = useRef<HTMLDivElement>(null);
  const adresseDropdownRef = useRef<HTMLDivElement>(null);

  const displayError = externalError || validationError;
  const displaySuccess = externalSuccess || internalSuccess;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (villeDropdownRef.current && !villeDropdownRef.current.contains(event.target as Node)) {
        setShowVilleDropdown(false);
      }
      if (adresseDropdownRef.current && !adresseDropdownRef.current.contains(event.target as Node)) {
        setShowAdresseDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced address search function
  const searchAddress = useCallback(async (query: string, isVille: boolean = false) => {
    if (!query || query.length < 2) {
      if (isVille) {
        setVilleSuggestions([]);
      } else {
        setAdresseSuggestions([]);
      }
      return;
    }

    try {
      if (isVille) {
        setVilleLoading(true);
      } else {
        setAdresseLoading(true);
      }

      const response = await fetch(`/api/search-address?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      if (isVille) {
        setVilleSuggestions(data.predictions || []);
      } else {
        setAdresseSuggestions(data.predictions || []);
      }
    } catch (error) {
      console.error("Error searching addresses:", error);
      if (isVille) {
        setVilleSuggestions([]);
      } else {
        setAdresseSuggestions([]);
      }
    } finally {
      if (isVille) {
        setVilleLoading(false);
      } else {
        setAdresseLoading(false);
      }
    }
  }, []);

  // Debounce timer for search
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleVilleSearch = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      searchAddress(value, true);
    }, 300);
  }, [searchAddress]);

  const handleAdresseSearch = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      searchAddress(value, false);
    }, 300);
  }, [searchAddress]);

  const handleVilleSelect = (option: AddressOption) => {
    setForm((prev) => ({ 
      ...prev, 
      ville: option.mainText,
      latitude: option.latitude,
      longitude: option.longitude,
    }));
    setShowVilleDropdown(false);
    setVilleSuggestions([]);
  };

  const handleAdresseSelect = (option: AddressOption) => {
    setForm((prev) => ({ 
      ...prev, 
      adresse_rue_et_num: option.description,
      latitude: option.latitude,
      longitude: option.longitude,
    }));
    setShowAdresseDropdown(false);
    setAdresseSuggestions([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget;
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);

    // Trigger address search for location fields
    if (name === "ville") {
      setShowVilleDropdown(true);
      handleVilleSearch(value);
    } else if (name === "adresse_rue_et_num") {
      setShowAdresseDropdown(true);
      handleAdresseSearch(value);
    }
  };

  const handleSelectSexe = (sexe: "homme" | "femme" | "autre") => {
    setForm((prev) => ({ ...prev, sexe }));
  };

  const handleCheckboxToggle = (value: string, fieldName: "type_incident" | "service_concerne_hopital") => {
    setForm((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(value)
        ? prev[fieldName].filter((item) => item !== value)
        : [...prev[fieldName], value],
    }));
    setValidationError(null);
  };

  const handleNext = () => {
    setValidationError(null);

    if (currentStep === 1) {
      if (!form.telephone.trim()) {
        setValidationError("Veuillez saisir le numéro de téléphone de l'appelant.");
        return;
      }
      if (!form.nom.trim() || !form.prenom.trim()) {
        setValidationError("Veuillez renseigner le nom et le prénom de l'appelant.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!form.ville.trim()) {
        setValidationError("Veuillez renseigner la ville.");
        return;
      }
      if (!form.adresse_rue_et_num.trim()) {
        setValidationError("Veuillez renseigner l'adresse (rue et numéro).");
        return;
      }
    }

    if (currentStep === 3) {
      if (form.type_incident.length === 0) {
        setValidationError("Veuillez sélectionner au moins un type d'incident.");
        return;
      }
      if (!form.depuis_quand.trim()) {
        setValidationError("Veuillez préciser la durée ou depuis quand survient l'incident.");
        return;
      }
      if (!form.details_evenement.trim()) {
        setValidationError("Veuillez ajouter des détails sur l'événement.");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation final step
    if (!form.etat_conscience || !form.etat_respiration || !form.etat_saignement || !form.etat_parole) {
      setValidationError("Veuillez compléter l'ensemble des éléments du bilan vital.");
      return;
    }

    try {
      const callData: CreateOperatorCallInput = {
        operatorId,
        caller: {
          telephone: form.telephone,
          nom: form.nom,
          prenom: form.prenom,
          age: parseInt(form.age) || 0,
          sexe: form.sexe,
        },
        location: {
          ville: form.ville,
          adresse_rue_et_num: form.adresse_rue_et_num,
          adresse_complements: form.adresse_complements,
          latitude: form.latitude,
          longitude: form.longitude,
        },
        event: {
          type_incident: form.type_incident,
          service_concerne_hopital: form.service_concerne_hopital,
          nombre_personnes: parseInt(form.nombre_personnes) || 1,
          depuis_quand: form.depuis_quand,
          details_evenement: form.details_evenement,
        },
        vitalAssessment: {
          etat_conscience: form.etat_conscience,
          etat_respiration: form.etat_respiration,
          etat_saignement: form.etat_saignement,
          etat_parole: form.etat_parole,
        },
        remarqueGenerale: form.remarqueGenerale || undefined,
      };

      await onSubmit(callData);
      setInternalSuccess(true);
      setForm(INITIAL_FORM);
      setCurrentStep(1);
      setTimeout(() => setInternalSuccess(false), 5000);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const stepsMeta = [
    { title: "Appelant", icon: "👤", desc: "Coordonnées de l'appelant" },
    { title: "Localisation", icon: "📍", desc: "Adresse de l'incident" },
    { title: "Nature", icon: "📋", desc: "Motif & détails" },
    { title: "Bilan", icon: "🩺", desc: "Bilan clinique vital" },
  ];

  return (
    <div className="w-full max-w-xl mx-auto bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-3xl shadow-xl overflow-hidden flex flex-col p-7 gap-6 transition-all duration-300 animate-scale-in">
      {/* Progress Circles Top Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />
          {stepsMeta.map((step, idx) => {
            const num = idx + 1;
            const isActive = currentStep === num;
            const isCompleted = currentStep > num;
            return (
              <button
                key={num}
                type="button"
                disabled={!isCompleted && !isActive}
                onClick={() => {
                  setValidationError(null);
                  setCurrentStep(num);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs z-10 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary-light)] scale-110"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-white dark:bg-gray-800 border border-[var(--border-color)] text-[var(--text-muted)] hover:border-gray-400"
                }`}
              >
                {isCompleted ? "✓" : num}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] font-extrabold text-[var(--text-light)] uppercase tracking-wider px-1">
          {stepsMeta.map((s, idx) => (
            <span
              key={idx}
              className={currentStep === idx + 1 ? "text-[var(--primary)]" : ""}
            >
              {s.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step Desc Title Banner */}
      <div className="bg-[var(--bg-badge-inactive)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center gap-3">
        <span className="text-2xl">{stepsMeta[currentStep - 1].icon}</span>
        <div>
          <h3 className="text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider">
            Étape {currentStep} sur 4
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5">
            {stepsMeta[currentStep - 1].desc}
          </p>
        </div>
      </div>

      {/* Messages */}
      {displaySuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-xs font-extrabold text-center animate-bounce">
          ✓ Fiche d&apos;appel enregistrée avec succès !
        </div>
      )}

      {displayError && (
        <div className="p-3.5 bg-[var(--danger-light)] border border-[var(--danger-border)] text-[var(--danger)] rounded-2xl text-xs font-extrabold text-center animate-pulse">
          ✗ {displayError}
        </div>
      )}

      {/* Form Content body */}
      <div className="flex-1 min-h-[300px]">
        {/* STEP 1: Caller info */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                name="telephone"
                required
                value={form.telephone}
                onChange={handleInputChange}
                placeholder="Ex: 06 12 34 56 78"
                className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  value={form.nom}
                  onChange={handleInputChange}
                  placeholder="Nom de famille"
                  className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  required
                  value={form.prenom}
                  onChange={handleInputChange}
                  placeholder="Prénom"
                  className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Âge
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="130"
                value={form.age}
                onChange={handleInputChange}
                placeholder="Ex: 42"
                className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
              />
            </div>

            {/* Sexe is placed on its own row so full words fit beautifully! */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Sexe
              </label>
              <div className="flex gap-2 bg-[var(--bg-input)] p-1.5 rounded-2xl shadow-sm">
                {[
                  { id: "homme", label: "Homme" },
                  { id: "femme", label: "Femme" },
                  { id: "autre", label: "Autre" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSexe(s.id as any)}
                    className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      form.sexe === s.id
                        ? "bg-white text-[var(--text-main)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            {/* Ville Autocomplete */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Ville *
              </label>
              <div className="relative" ref={villeDropdownRef}>
                <input
                  type="text"
                  name="ville"
                  required
                  value={form.ville}
                  onChange={handleInputChange}
                  onFocus={() => form.ville && setShowVilleDropdown(true)}
                  placeholder="Ex: Paris"
                  className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
                />
                {villeLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
                  </div>
                )}
                {showVilleDropdown && villeSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-[var(--primary)] rounded-2xl shadow-lg max-h-64 overflow-y-auto">
                    {villeSuggestions.map((option) => (
                      <button
                        key={option.placeId}
                        type="button"
                        onClick={() => handleVilleSelect(option)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[var(--primary)] hover:text-white transition-colors flex flex-col gap-0.5"
                      >
                        <div className="text-xs font-semibold">{option.mainText}</div>
                        {option.secondaryText && (
                          <div className="text-[10px] opacity-75">{option.secondaryText}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Adresse Autocomplete */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Adresse *
              </label>
              <div className="relative" ref={adresseDropdownRef}>
                <input
                  type="text"
                  name="adresse_rue_et_num"
                  required
                  value={form.adresse_rue_et_num}
                  onChange={handleInputChange}
                  onFocus={() => form.adresse_rue_et_num && setShowAdresseDropdown(true)}
                  placeholder="Ex: 12 Rue de Rivoli"
                  className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
                />
                {adresseLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
                  </div>
                )}
                {showAdresseDropdown && adresseSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-[var(--primary)] rounded-2xl shadow-lg max-h-64 overflow-y-auto">
                    {adresseSuggestions.map((option) => (
                      <button
                        key={option.placeId}
                        type="button"
                        onClick={() => handleAdresseSelect(option)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[var(--primary)] hover:text-white transition-colors flex flex-col gap-0.5"
                      >
                        <div className="text-xs font-semibold">{option.mainText}</div>
                        {option.secondaryText && (
                          <div className="text-[10px] opacity-75">{option.secondaryText}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compléments d'adresse */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Compléments d&apos;adresse
              </label>
              <input
                type="text"
                name="adresse_complements"
                value={form.adresse_complements}
                onChange={handleInputChange}
                placeholder="Ex: Bâtiment B, Escalier 3, Code 45A9"
                className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Incident Details */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Motifs d&apos;incident * (Sélection multiple)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-2 border border-[var(--border-color)] bg-[var(--bg-input)] rounded-2xl custom-scrollbar">
                {INCIDENT_TYPES.map((inc) => {
                  const isChecked = form.type_incident.includes(inc);
                  return (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleCheckboxToggle(inc, "type_incident")}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[var(--primary)] text-white border-transparent"
                          : "bg-white text-[var(--text-muted)] border-[var(--border-color)] hover:border-gray-400"
                      }`}
                    >
                      {inc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Services hospitaliers concernés
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto p-2 border border-[var(--border-color)] bg-[var(--bg-input)] rounded-2xl custom-scrollbar">
                {HOSPITAL_SERVICES.map((srv) => {
                  const isChecked = form.service_concerne_hopital.includes(srv);
                  return (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => handleCheckboxToggle(srv, "service_concerne_hopital")}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[var(--primary)] text-white border-transparent"
                          : "bg-white text-[var(--text-muted)] border-[var(--border-color)] hover:border-gray-400"
                      }`}
                    >
                      {srv}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Nb Personnes
                </label>
                <input
                  type="number"
                  name="nombre_personnes"
                  min="1"
                  value={form.nombre_personnes}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] transition-all outline-none shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Depuis quand *
                </label>
                <input
                  type="text"
                  name="depuis_quand"
                  required
                  value={form.depuis_quand}
                  onChange={handleInputChange}
                  placeholder="Ex: 30 minutes, 2 heures"
                  className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Détails / Description *
              </label>
              <textarea
                name="details_evenement"
                required
                rows={2}
                value={form.details_evenement}
                onChange={handleInputChange}
                placeholder="Décrivez les circonstances exactes de l'incident..."
                className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm custom-scrollbar"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Clinical Triage Assessment */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  État de conscience *
                </label>
                <select
                  name="etat_conscience"
                  required
                  value={form.etat_conscience}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-input)] border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] transition-all outline-none shadow-sm cursor-pointer"
                >
                  <option value="">-- Conscience --</option>
                  {CONSCIOUSNESS_STATES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Respiration *
                </label>
                <select
                  name="etat_respiration"
                  required
                  value={form.etat_respiration}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-input)] border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] transition-all outline-none shadow-sm cursor-pointer"
                >
                  <option value="">-- Respiration --</option>
                  {BREATHING_STATES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Saignement *
                </label>
                <select
                  name="etat_saignement"
                  required
                  value={form.etat_saignement}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-input)] border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] transition-all outline-none shadow-sm cursor-pointer"
                >
                  <option value="">-- Saignement --</option>
                  {BLEEDING_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                  Élocution / Parole *
                </label>
                <select
                  name="etat_parole"
                  required
                  value={form.etat_parole}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-input)] border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] transition-all outline-none shadow-sm cursor-pointer"
                >
                  <option value="">-- Élocution --</option>
                  {SPEECH_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-light)]">
                Remarques supplémentaires
              </label>
              <textarea
                name="remarqueGenerale"
                rows={2}
                value={form.remarqueGenerale}
                onChange={handleInputChange}
                placeholder="Ajoutez d'autres informations cliniques pertinentes si nécessaire..."
                className="w-full bg-[var(--bg-input)] hover:bg-gray-200 focus:bg-white border-none focus:ring-2 focus:ring-[var(--primary)] px-4 py-3.5 rounded-2xl text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-light)] transition-all outline-none shadow-sm custom-scrollbar"
              />
            </div>
          </form>
        )}
      </div>

      {/* Wizard Footer Action Buttons */}
      <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-5 flex-shrink-0">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-[var(--bg-badge-inactive)] hover:bg-gray-200 text-[var(--text-main)] font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            ← Précédent
          </button>
        ) : (
          <div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs transition-all cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              {loading ? "Envoi..." : "Envoyer l'appel ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
