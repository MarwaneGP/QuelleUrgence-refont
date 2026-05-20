import { Metadata } from 'next';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Gestion des opérateurs',
  description: 'Administration des comptes opérateurs (médecins)',
};

export default function AdminOperateursLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
