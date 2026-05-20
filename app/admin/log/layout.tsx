import { Metadata } from 'next';
import AdminAuthGuard from '@/components/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Journal d\'audit',
  description: 'Traçabilité des actions effectuées sur le site',
};

export default function AdminLogLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
