import { Metadata } from 'next';
import OperatorAuthGuard from '@/components/OperatorAuthGuard';

export const metadata: Metadata = {
  title: 'Interface Opérateur',
  description: 'Formulaire de triage médical pour les opérateurs',
};

export default function OperateurLayout({ children }: { children: React.ReactNode }) {
  return <OperatorAuthGuard>{children}</OperatorAuthGuard>;
}
