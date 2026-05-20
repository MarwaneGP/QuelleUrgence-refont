import { Metadata } from 'next';
import AdminAuthGuard from '@/components/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Gestion des opérateurs',
  description: 'Administration des comptes opérateurs (médecins)',
};

export default function AdminOperateursLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
