import type { Metadata } from 'next';
import OperatorAuthGuard from '@/components/OperatorAuthGuard';

export const metadata: Metadata = {
  title: 'Historique',
  description: 'Historique des dossiers opérateur',
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <OperatorAuthGuard>{children}</OperatorAuthGuard>;
}
