"use client";

import { useState } from "react";
import Header from "@/components/Header";
import OperatorCallForm from "@/components/operateur/OperatorCallForm";
import { CreateOperatorCallInput } from "@/types/operator";

export default function OperateurPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const operatorId = process.env.NEXT_PUBLIC_OPERATOR_ID ?? "";

  const handleFormSubmit = async (callData: CreateOperatorCallInput) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/operators/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

      console.log("Appel enregistrÃ© avec succÃ¨s");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 pb-24 md:pb-8"
        tabIndex={-1}
      >
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8 animate-fade-in">
          {/* Header section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
                DÃ©clarer une urgence
              </h1>
            </div>
            <p className="text-xs md:text-sm text-[var(--text-muted)] font-semibold -mt-2">
              Remplissez ce formulaire pour signaler une situation d&apos;urgence. Un opÃ©rateur prendra en charge votre demande rapidement.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-[var(--danger-light)] border-l-4 border-[var(--danger)] text-[var(--danger)] rounded-[var(--border-radius-sm)] text-sm font-semibold shadow-sm">
              âœ— {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: The progressive wizard call form */}
            <div className="lg:col-span-7 w-full">
              {!operatorId ? (
                <div className="bg-[var(--bg-frame)] border border-[var(--border-color)] rounded-3xl p-6 text-sm font-semibold text-[var(--danger)]">
                  Variable manquante: configurez NEXT_PUBLIC_OPERATOR_ID dans .env
                </div>
              ) : (
                <OperatorCallForm
                  operatorId={operatorId}
                  onSubmit={handleFormSubmit}
                  loading={loading}
                  error={error}
                  success={success}
                />
              )}
            </div>

            {/* Right side: User-friendly guidance */}
            <div className="lg:col-span-5 space-y-6">
              {/* What happens after you submit */}
              <div className="bg-[var(--bg-frame)] border border-[var(--border-color)] p-6 rounded-3xl shadow-lg space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Comment Ã§a marche ?
                </h3>

                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="block text-[11px] text-[var(--text-main)]">Remplissez le formulaire</strong>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                        DÃ©crivez la situation Ã©tape par Ã©tape : identitÃ©, localisation, nature de l&apos;incident et Ã©tat de la victime.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="block text-[11px] text-[var(--text-main)]">Un opÃ©rateur analyse votre demande</strong>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                        Votre fiche est transmise instantanÃ©ment Ã  un opÃ©rateur de rÃ©gulation qui Ã©value la gravitÃ© et la prioritÃ©.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="block text-[11px] text-[var(--text-main)]">Orientation vers l&apos;hÃ´pital le plus adaptÃ©</strong>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                        Vous recevez une recommandation d&apos;hÃ´pital avec le temps d&apos;attente estimÃ© et un itinÃ©raire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips for the user */}
              <div className="bg-[var(--bg-frame)] border border-[var(--border-color)] p-6 rounded-3xl shadow-lg space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Conseils pour bien remplir
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                      <strong className="text-[var(--text-main)]">Soyez prÃ©cis sur l&apos;adresse</strong> â€” numÃ©ro de rue, code postal, digicode ou Ã©tage si applicable.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                      <strong className="text-[var(--text-main)]">DÃ©crivez les symptÃ´mes observÃ©s</strong> â€” mÃªme les dÃ©tails qui semblent mineurs peuvent aider au triage.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                      <strong className="text-[var(--text-main)]">Gardez votre tÃ©lÃ©phone accessible</strong> â€” un opÃ©rateur pourrait vous rappeler pour obtenir plus de dÃ©tails.
                    </p>
                  </div>
                </div>
              </div>

              {/* Urgent situation reminder */}
              <div className="bg-red-50 border border-red-200 p-5 rounded-3xl shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-xl bg-white text-red-500 flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-red-700">Urgence vitale immÃ©diate ?</h4>
                    <p className="text-[10px] text-red-600/80 mt-1 leading-snug">
                      Si la personne est inconsciente, ne respire plus ou saigne abondamment, appelez immÃ©diatement le <strong>15 (SAMU)</strong> ou le <strong>112</strong>. Ne perdez pas de temps Ã  remplir ce formulaire.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}



