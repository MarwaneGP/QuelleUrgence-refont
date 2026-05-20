import { Metadata } from 'next';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Journal d\'audit',
  description: 'Traçabilité des actions effectuées sur le site',
};

export default function AdminLogLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
