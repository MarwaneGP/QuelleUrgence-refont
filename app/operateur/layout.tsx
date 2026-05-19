import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interface Opérateur',
  description: 'Formulaire de triage médical pour les opérateurs',
};

export default function OperateurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
