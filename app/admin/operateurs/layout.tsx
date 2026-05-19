import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestion des opérateurs',
  description: 'Administration des comptes opérateurs (médecins)',
};

export default function AdminOperateursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
