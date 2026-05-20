import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvel Appel d\'Urgence | Interface Opérateur',
  description: 'Formulaire pour enregistrer un nouvel appel d\'urgence',
};

export default function NouvelAppelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
